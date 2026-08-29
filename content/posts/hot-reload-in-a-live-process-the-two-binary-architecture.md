---
title: "Hot Reload in a Live Process: The Two-Binary Architecture"
created_at: 2025-09-12T00:00:00.000Z
updated_at: 2026-08-28T00:00:00.000Z
published: true
category_slug: technical
tags:
  - C++
  - Windows
  - Hot Reload
  - DLL Injection
  - DetourModKit
  - Modding
  - Reverse Engineering
cover_image: /uploads/images/blog/hot-reload-module-pins.webp
description: "The two-binary architecture behind hot DLL reload: replace native code in a running game."
---

My least favourite part of native modding is the loop. Change one line, rebuild, boot the game, sit through the logos, load the save, walk back to the exact spot where the bug lives. That's 2-3 minutes per attempt, 40 times a day, and at some point you stop calling it a workflow and start calling it a tax 😮‍💨

Hot DLL replacement is what you build when you decide to stop paying: you replace compiled native code inside a process that's already running, and the process keeps everything it had.

That last part is the reason anyone wants this. A restart is a deletion. It discards the save, the loaded level, the physics state and the three minutes of specific input that produced the bug, which is to say it discards the exact conditions that made the bug reachable in the first place. Replacing the code and keeping the state inverts that: you edit, rebuild, and the running world picks up the new behaviour without ever having been anywhere else.

**All the mechanics here are Windows**, purely because that's where the DLLs are. The problem underneath isn't Windows-specific; any time a process maps code it later intends to unmap, somebody other than you gets a vote, and the call you're using to ask doesn't tell you who.

Also, heads up ⚠️ this post is long. Really long. I tried to make it shorter and failed. Grab a drink and get comfy 🍵

The architecture that makes any of it possible has a fixed point, and everything else follows from where you put it.

## The two-binary split

You can't hot reload the thing that's doing the reloading. That sentence is the whole architecture, and most of what follows is a consequence of it.

So you inject two binaries instead of one. The first is a thin resident loader. It gets injected once, by whatever mechanism your platform gives you, and its `DllMain` does almost nothing: it spawns a control thread and returns. The loader lock is held across that entry point, and while it's held the only safe operations are the ones that don't touch the loader or wait on a thread that might, which rules out every single step of a reload. So the entry point's whole job is to get off that lock and hand the work to a thread that isn't holding it. That control thread is the only long-lived thing in the design, and it's the piece that never unloads for the entire life of the process.

The control thread also owns the trigger, which looks like a free choice and isn't. The loader has no hooks and no window of its own, so it needs its own way to notice that you want a reload: a polled key state check, a named event, a watched file, any of the three will do. What it can't do is take the trigger from the logic DLL, because a trigger that lives in the generation can't survive the teardown it starts.

The second binary is the logic DLL, and it holds everything you actually edit. Hooks, configuration, feature code, input bindings, the interface, the state machine you're currently getting wrong. When you press reload, this is the binary that gets torn down and mapped again.

The split is what makes the problem tractable at all, because it turns "replace running code" into "replace code that something else, which isn't being replaced, holds a handle to". Without it there's no fixed point. Whatever calls the unload has to survive the call, and code that unmaps itself is a stunt rather than a design.

<pre class="mermaid flex justify-center">
graph TD
    subgraph "The two-binary split"
        INJ["Injector"] -->|"injects once, at startup"| LOADER["Resident loader<br/>never unloads"];
        LOADER -->|"spawns"| CTRL["Control thread<br/>runs off the loader lock"];
        CTRL -->|"owns"| POLICY["Reload policy, staged names,<br/>persistent state, the verdict"];
        CTRL -->|"loads, and replaces"| GEN["Logic DLL, generation N<br/>hooks, config, features, bindings"];
        GEN -->|"hooks and patches"| PROC["The running process<br/>memory, threads, registrations"];
        GEN -.-> SWAP(["Only this half is ever replaced."]);
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    classDef resident fill:#282a36,stroke:#8be9fd,stroke-width:2px,color:#8be9fd;
    classDef swappable fill:#282a36,stroke:#50fa7b,stroke-width:2px,color:#50fa7b;
    class INJ,PROC default;
    class LOADER,CTRL,POLICY resident;
    class GEN,SWAP swappable;
</pre>

The rule for deciding which side a thing belongs on is short. Anything you want to edit without restarting goes in the logic DLL. Anything that has to survive a reload goes in the loader.

That second category is larger than it looks the first time you draw the line. Reload policy lives there, because a decision about whether to unload can't be made by the thing being unloaded. Staged file names live there, because they have to be chosen by something that remembers what the previous generation was called. Persistent state lives there, meaning any value you want to carry across a swap, because a global in the logic DLL is by definition gone. And the unload verdict lives there, because the loader is the only party in a position to act on it.

There's a third category worth naming early, though it takes a later section to earn: anything that takes a permanent hold on the module it lives in. Those exist, they're not always avoidable, and when you find one the answer is to move it to the loader.

## What a generation is

The unit of replacement needs a name, and "the DLL" isn't it, because there will be more than one of them mapped at the same time and you'll need to talk about which. Call each load of the logic DLL a generation.

A generation has an identity, and the cheapest way to give it one is the file name. Copy each build to a name nothing in the process has ever loaded before, `ModName.gen0042.logic.dll`, and load that copy rather than the build output.

This looks like hygiene. It's load bearing, and the section on the operating system explains exactly why: on Windows the file name is the key the loader uses to decide whether you're asking for a new image or handing it a path it already has mapped. A unique name per generation is the difference between "map fresh bytes" and "hand back whatever is already there".

The same argument applies one step earlier in the pipeline, on the build side. A staged copy is only ever as good as the file it copied, and a reload triggered while the linker is still writing its output copies whatever bytes happen to exist at that instant. Nothing downstream can recognise a partial PE as partial: the load either fails for a reason that looks unrelated to timing, or it maps something that isn't the build you think you're running. So the build should publish atomically. Link to a temporary name and rename it into place, because a rename is atomic and a reader therefore only ever observes the previous complete file or the new complete one, never a half-written image in between. That's a line in a build script, and it removes the race from the design rather than making it less likely.

Once you have that unit, the useful question becomes: what actually resets at a generation boundary?

Everything with static storage duration in the logic DLL resets, if and only if the image genuinely unmapped. Globals get their initialisers run again. Function-local statics forget that they ever ran, so the guard variable behind a lazy singleton is clear and the singleton is constructed a second time. Anything you built inside `Init` is gone and rebuilt from nothing. That's the property the whole loop is bought for, and it's exactly the property the naive implementation silently fails to deliver.

Everything else doesn't reset, and that list is longer. Memory in the host process that you patched stays patched, because you wrote it into somebody else's address space and nothing about unmapping your module walks it back. Files you wrote stay written. Handles you leaked stay leaked. OS registrations you made and didn't remove stay registered, now pointing at addresses that are about to stop existing. Threads you started and didn't join keep running. And anything the loader owns survives by construction, because the loader isn't being replaced.

<pre class="mermaid flex justify-center">
graph LR
    subgraph "Across one generation boundary"
        direction LR
        N["Generation N"] -->|"Shutdown, FreeLibrary,<br/>image unmapped"| X(("swap"));
        X -->|"LoadLibrary, Init,<br/>from nothing"| N1["Generation N+1"];
        RESET["Globals and their initialisers<br/>function-local statics and guards<br/>everything Init built"] -.->|"reset, and only if the<br/>image genuinely unmapped"| X;
        KEEP["Patched host memory, written files,<br/>leaked handles, OS registrations,<br/>unjoined threads, loader-owned state"] ==>|"survives, whether<br/>you meant it to or not"| N1;
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    classDef reset fill:#282a36,stroke:#50fa7b,stroke-width:2px,color:#50fa7b;
    classDef keep fill:#282a36,stroke:#ffb86c,stroke-width:2px,color:#ffb86c;
    class N,N1,X default;
    class RESET reset;
    class KEEP keep;
</pre>

Which makes the state ownership question explicit, and it's worth asking deliberately rather than discovering it later: for every piece of state in your logic DLL, do you want it to survive a reload or not? If yes, it doesn't belong in the logic DLL, it belongs behind an interface the loader owns and the generation borrows. If no, it belongs in the logic DLL, and a reload is the mechanism that clears it. There's no third answer, and the design gets much simpler once you stop looking for one.

Answering it deliberately is also the clearest way to see what this technique actually preserves, because "hot reload" oversells it in one direction and undersells it in the other. What happens to the mod is a cold restart, which is the reset list above read as a policy rather than a mechanism: every generation loses its own state by design. What stays hot is the host, item for item the list the opening said a restart deletes. That was the state you were trying not to lose, and it's exactly the state that survives. Losing the generation's own state along the way is a feature rather than a toll, because reinitialising from a clean slate runs the same initialisation code the shipped build runs on its way up, so the loop you use 40 times a day keeps exercising your real startup instead of a warm path that only exists on your machine.

## The boundary between them

The two halves have to talk, and the shape of that conversation is the part you'll regret getting wrong, because it's the one piece you can't change without rebuilding the half that never unloads.

Keep it small. In practice a working boundary is three C exports.

`Init` takes a pointer to a context structure the loader owns and reports whether the generation came up. `Shutdown` asks the generation to tear itself down and returns a verdict. `Revision` returns a build identifier, and I'll argue in a moment that it's the cheapest correctness tool in the whole design.

Everything crossing that boundary is C. Not "C-like", not "C++ but only the simple parts", C. No `std::string`, no containers, no owning smart pointers, no exceptions, no virtual interfaces, no type whose layout your compiler is allowed to rearrange between builds. The reason isn't portability or taste. It's that the two binaries are compiled at different times and, in the worst case, don't agree about which standard library they're using. A container crossing that boundary is a promise about heap ownership and layout, made by one compiler invocation to another one that hasn't happened yet. An owning pointer crossing it is a promise about which allocator frees the memory, and the answer to that changes the moment the generation that allocated it unmaps. An exception crossing it is undefined behaviour with a plausible-looking stack trace attached.

The context structure is fixed width, and its first two fields do most of the work: a `struct_size` in bytes and an ABI version number. The loader fills both in. The generation checks both, immediately, before it reads anything else, and refuses to initialise if either disagrees with what it was compiled against. That's four lines of code, and it converts the entire class of "I rebuilt the logic DLL against a newer header and the loader is still the old one" from silent memory corruption into a log line. Without it, a stale generation reads a shifted layout, gets a function pointer where it expected a boolean, and fails somewhere with no visible relationship to the cause. Version the struct, never rearrange it, and only ever append to it.

Then the revision export. It costs one function returning a constant, and it's worth far more than that, because it's the only thing in the design that a stale image physically can't fake. If the loader logs the revision the generation reports, and the revision is baked from something that changes on every build, then a load that reports the previous revision has just told you that it read the previous bytes. No inference, no guessing, one line in the log that's either the number you expected or the proof that something went wrong three steps earlier. Be careful what you bake it from: `__DATE__` is a trap, because it moves only when its own translation unit recompiles, and the translation unit holding your version constant is exactly the one least likely to change when you edit a feature.

Keep the boundary narrow for one more reason. Every addition to it is a loader rebuild, and a loader rebuild costs a full process restart, which is the thing all of this exists to avoid. Three functions and one append-only struct is a boundary you can leave alone for months while you rewrite everything behind it.

## The reload sequence

With the split, the generation and the boundary in place, the reload itself is an ordered sequence with a decision in the middle.

**Serialise the request.** Reload is triggered by a person pressing a key, and people press keys twice. Exactly one reload runs at a time, and a second request arriving mid-cycle is dropped or queued, never interleaved. Two concurrent teardowns of the same image is a category of bug you don't want to be able to have.

**Ask the current generation to shut down, and let it refuse.** This is the step that separates this architecture from the naive one, so it's worth being blunt about: `Shutdown` is a request, not a command. It returns a verdict. Exactly one value means the teardown found nothing of its own that can still re-enter, which is the loader's cue to proceed once the caller's own preconditions have been met: hooks dropped, workers joined, raw patches reverted. Every other value is a refusal with a reason, and the correct response to a refusal is to leave the image mapped, log the reason, and let the next press try again. A teardown that can't fail is a teardown that isn't checking anything.

**Confirm the resident side let go.** If any part of the generation's work is driven through the resident half, which the section on permanent references will argue is sometimes mandatory, then the generation holds a registration against the loader for as long as it's alive: it opens one at `Init` and closes it at `Shutdown`. Call it a lease. The loader can ask its own resident side whether that lease is closed, and that answer is worth more than every other check in this list put together, because it's the only question about the generation that the loader can answer without trusting the image it's about to unmap.

**Prove the release.** The loader drops its own reference, and then verifies that the image is actually gone, which is a different question from whether the release call succeeded. If the proof fails, the generation has already been torn down and can't be put back. Two honest responses exist and the choice is a policy one: end the reload cycle for this session, or book the image as retained, charge it against a bounded budget of retained images, and load the next generation over it. The first is simpler to reason about. The second keeps the loop alive through exactly the refusals this architecture exists to make possible, and it's why the diagram below opens by asking whether there's budget left before it starts a cycle it might not be able to finish.

**Map a fresh generation.** New staged name, new file, new image, and a name that has never been used before so the platform can't quietly hand back something old.

**Resolve exports, initialise, log the revision.** Resolve the three boundary functions, call `Init` with the context struct, check what it returns, and print the revision the new image reports. That last line is the one you actually read.

More than one of those steps is allowed to say no, and the refusals don't cost the same. A shutdown refusal is cheap: nothing has been destroyed, the live generation carries on serving the game, and the next press tries again against a newer build. A failed release proof is expensive, because by then the teardown has happened and there's nothing to go back to. Design around that asymmetry. Put as much of the checking as you can before the point of no return, and make the cheap refusal the common path.

<pre class="mermaid flex justify-center">
graph TD
    subgraph "A reload allowed to say no"
        START["Reload requested"] --> BUD{"Retained<br/>budget left?"};
        BUD -- No --> RESTART["Restart required<br/>the cycle ends here"];
        BUD -- Yes --> SHUT{"Shutdown says<br/>safe to unload?"};
        SHUT -- No --> RETRY["Image stays mapped<br/>retry next build"];
        SHUT -- Yes --> LEASE{"Lease provably<br/>closed?"};
        LEASE -- No --> RETRY;
        LEASE -- Yes --> FREE["Release the loader's<br/>reference"];
        FREE --> PROBE{"Address still<br/>resolves?"};
        PROBE -- Yes --> RETAIN["Retain it, charge<br/>the budget"];
        PROBE -- No --> DEL["Delete the<br/>staged file"];
        RETAIN --> NEXT["Load the next<br/>generation"];
        DEL --> NEXT;
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    classDef refuse fill:#282a36,stroke:#ffb86c,stroke-width:2px,color:#ffb86c;
    classDef fatal fill:#282a36,stroke:#ff5555,stroke-width:2px,color:#ff5555;
    classDef pass fill:#282a36,stroke:#50fa7b,stroke-width:2px,color:#50fa7b;
    class START,BUD,SHUT,LEASE,FREE,PROBE default;
    class RETRY,RETAIN refuse;
    class RESTART fatal;
    class DEL,NEXT pass;
</pre>

## What the OS actually gives you

All of the above assumes the platform will cooperate. It mostly does, but the promises it makes are narrower than the names of the functions suggest, and four of them shape the entire architecture.

**`LoadLibrary` on an already-mapped path doesn't re-read the file.** It resolves the path to a canonical form, looks it up in the process's loaded-module database, finds the existing entry, increments that entry's reference count, and hands back the `HMODULE` it already had. No error. No warning. Nothing in the return value distinguishes it from a fresh map. If the previous generation is still mapped under that name, then the load you just performed was a reference count increment, `Init` is about to run a second time over the old bytes, and every log line on the way will say it worked.

This is where the unique staged name earns its keep, and it's why that convention is a mechanism rather than tidiness. A path that has never been loaded before can't resolve to an existing entry, so the call has exactly two outcomes: it maps fresh bytes off disk, or it fails loudly. That turns stale image reuse from a silent state into an impossible one, which is a much better class of bug to not have.

<pre class="mermaid flex justify-center">
graph TD
    subgraph "What the file name decides"
        CALL["LoadLibrary(path)"] --> Q{"Has this exact path<br/>been loaded before?"};
        Q -->|"yes: the build output, reused every generation"| HIT["The database already holds an entry<br/>the count goes up, the file is never opened"];
        HIT --> STALE["Returns the generation 1 handle<br/>no error, no warning,<br/>indistinguishable from a fresh map"];
        STALE -.-> SNOTE(["The build you just made never runs."]);
        Q -->|"no: a unique staged name"| MISS["No entry can match a name<br/>that has never been loaded"];
        MISS --> FRESH["Reads the generation 2 bytes off disk<br/>maps fresh bytes, or fails loudly"];
        FRESH -.-> FNOTE(["Exactly two outcomes, and both are honest."]);
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    classDef stale fill:#282a36,stroke:#ff5555,stroke-width:2px,color:#ff5555;
    classDef fresh fill:#282a36,stroke:#50fa7b,stroke-width:2px,color:#50fa7b;
    class CALL,Q default;
    class HIT,STALE,SNOTE stale;
    class MISS,FRESH,FNOTE fresh;
</pre>

**`FreeLibrary` at most decrements a count, and that's the whole of what it tells you.** It returns nonzero when the call succeeded, and the call succeeding has almost no relationship to the thing you wanted to know. It does not even promise a decrement: on a module somebody pinned, `FreeLibrary` returns nonzero and changes nothing at all. It returns `TRUE` on a module with four other references outstanding, `TRUE` on a module that will never unmap again for the life of the process, and `TRUE` on a module that unmapped cleanly. Three different worlds, one return value. Everything downstream in this post depends on separating them.

<pre class="mermaid flex justify-center">
graph TD
    subgraph "What nonzero can mean"
        CALL["FreeLibrary(hModule)<br/>returns nonzero: the<br/>call succeeded"];
        CALL --> W1["5 references, now 4<br/>still mapped<br/>may unmap later"];
        CALL --> W2["2 references, now 1<br/>a keepalive survives<br/>never unmaps again"];
        CALL --> W3["1 reference, now 0<br/>nothing else held it<br/>the pages are gone"];
        W1 -.-> PROBE;
        W2 -.-> PROBE;
        W3 -.-> PROBE;
        PROBE["GetModuleHandleExW with<br/>FROM_ADDRESS and<br/>UNCHANGED_REFCOUNT, on an<br/>address saved before release"];
        PROBE -.-> ANS(["Failing to resolve it<br/>is the success condition."]);
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    classDef held fill:#282a36,stroke:#ffb86c,stroke-width:2px,color:#ffb86c;
    classDef pinned fill:#282a36,stroke:#ff5555,stroke-width:2px,color:#ff5555;
    classDef gone fill:#282a36,stroke:#50fa7b,stroke-width:2px,color:#50fa7b;
    classDef probe fill:#282a36,stroke:#8be9fd,stroke-width:2px,color:#8be9fd;
    class CALL default;
    class W1 held;
    class W2 pinned;
    class W3 gone;
    class PROBE,ANS probe;
</pre>

**Executing code inside a module holds no reference to it.** This one catches almost everybody, because it's the opposite of the intuition. A thread running your function, right now, on your code pages, contributes nothing to the module's reference count. The count tracks handles, not stack frames. Which is why a thread meant to outlive the function that created it needs a counted reference of its own, taken by its creator before `CreateThread` rather than by the thread body once it is already running, and held until the thread has finished. Taking it as the thread's first instruction has already lost: the module can unmap in the window before that instruction runs, and the start address goes with it. A detached thread that skipped that step isn't a pin on the module; it's the crash, waiting for the unmap to happen underneath it.

**The unload path sends no thread detach notification at all.** Thread attach notifications go only to threads created after your module was mapped, but thread detach notifications are a different rule: every thread that exits cleanly while your module is loaded runs your entry point with `DLL_THREAD_DETACH`, whenever it was created. The unload itself is the case that delivers nothing. When `FreeLibrary` drops the last reference, it runs your [entry point](https://learn.microsoft.com/en-us/windows/win32/dlls/dllmain) once, on the calling thread, with `DLL_PROCESS_DETACH`, and no other thread is told your module is going away; when the count doesn't reach zero it runs nothing at all. So `thread_local` state your code created on a host thread isn't cleaned up by the unload, and its destructor, if it runs at all, runs against code that's no longer mapped. Thread-local storage in a swappable module needs explicit teardown driven by your own `Shutdown`, on every thread that touched it, or it needs to not exist.

Read those four together and the shape of the problem is visible. The platform will tell you what it did. It won't tell you what's true. `LoadLibrary` reports a module mapped at a path, not a fresh image. `FreeLibrary` reports a decrement, not an unmap. The reference count reports handles, not reachability. And nothing at all, anywhere in the API surface, reports quiescence. Every remaining section is about the gap between those two columns.

## Where the architecture goes wrong

Here's the reload body almost everyone writes first, and I want to be fair to it, because the architecture around it is correct and this is the only part that isn't. It fits on a screen, which is a large part of why it's so persuasive.

```cpp title="mod_loader.cpp - the reload everyone writes first (simplified)" showLineNumbers
constexpr const char *LOGIC_DLL_NAME = "mod_logic.dll";
constexpr DWORD CALLBACK_DRAIN_MS = 100;
constexpr DWORD FILE_SETTLE_MS = 200;

static void reload_logic_dll()
{
    s_shutdown_fn();              // returns void, so there is nothing to read
    Sleep(CALLBACK_DRAIN_MS);     // "let in-flight callbacks return"

    FreeLibrary(s_logic_module);  // return value discarded
    s_logic_module = nullptr;
    Sleep(FILE_SETTLE_MS);        // "let file locks release"

    copy_from_staging();          // return value discarded

    s_logic_module = LoadLibraryA(s_logic_dll_path.c_str());  // the same path, every time
    s_init_fn = reinterpret_cast<InitFn>(GetProcAddress(s_logic_module, "Init"));
    s_shutdown_fn = reinterpret_cast<ShutdownFn>(GetProcAddress(s_logic_module, "Shutdown"));
    s_init_fn();

    loader_log("Logic DLL loaded and initialized successfully");
}
```

Three signals in there go unread by construction. `Shutdown` returns `void`, so there's nothing to read. `FreeLibrary`'s return is discarded. The two sleeps report nothing at all, because elapsed time is the only thing they measure. The fairer version of this loop checks `LoadLibraryA`'s result, both `GetProcAddress` results, `Init`'s returned bool and the staging copy, which is four real checks and not one of them decorative. It has the same two structural defects, and that's the point: the defects aren't missing error handling.

**A fixed sleep is offered as a proof of quiescence and can't be one.** The invariant it stands in for is easy to state: removing a hook is safe only if the hooked function is quiescent at that instant. The sleep is the mechanism proposed for satisfying it, and the mechanism doesn't work, because a detour frame has no upper bound on its lifetime. A detour that logs into a stalled sink holds its frame for as long as the sink takes. A detour waiting on a lock held by a lower-priority thread holds it until the scheduler decides to run that thread. A detour whose next code page is demand paged holds it across a disk read. And the one that ends the argument: a window procedure entered from a **nested modal message loop** doesn't return until a human dismisses a menu. Minutes, not milliseconds, and that's the pause screen, not an exotic case.

Which also kills the most common intuition about when it's safe to reload. A quiet moment feels like the right time, and a pause screen feels like the quietest moment available. That gets it backwards: fewer *calls* is not fewer *live frames*, and a pause screen is very often the nested pump parking the exact frame you're about to unmap. Increasing the sleep moves a probability. It never reaches a proof, because the events being waited on have no bound to move past.

The second sleep, the one waiting for file locks to settle, is worse, because it isn't clear what it could ever prove. If your own reference was the last one, the unmap normally completes inside the call and the file is free by the time `FreeLibrary` returns, though a concurrent release elsewhere is exactly why the probe further down polls instead of sampling once. If it wasn't the last one, the lock belongs to a holder that no sleep can bound. The only thing the sleep can outlast is a transient third party, an antivirus scanner holding the file open, and a guess is still a guess against that. Your own build system isn't on that list any more, because the atomic publish above took it off.

**Every step checks a condition strictly weaker than the question that matters.** This is the second defect, and the sleeps are only its loudest instance. Walk the cycle and it's one bug repeated. `Shutdown` returns `void`, where the question was whether every callback source stopped. The drain reports that 100 ms elapsed, where the question was quiescence. `FreeLibrary` reports a decrement, where the question was an unmap. A non-null `HMODULE` reports a module mapped at that path, where the question was a fresh image. `GetProcAddress` reports an export named `Init`, where the question was the *new* `Init`. And then a log line says all of it out loud.

A weaker question answered correctly is exactly what a silent failure looks like from the inside. So the failure signature is worse than a crash: you edit a file, rebuild, press reload, read `Logic DLL loaded and initialized successfully`, watch the old behaviour continue, and go looking for the bug in your build system. You add print statements that never run. You doubt the compiler, then the object cache, then CMake. The loop is reporting success in exactly the conditions where nothing happened, which is the one thing a status line must never do.

The tell, once you know to look for it, is a value in the log that should have moved and didn't. Reconstructed from memory, the three reloads that started all of this printed three identical lines:

```text title="three reloads, three identical lines"
Config: 32 registered values ... | Built on Aug 19 2026 at 22:14:10
Config: 32 registered values ... | Built on Aug 19 2026 at 22:14:10
Config: 32 registered values ... | Built on Aug 19 2026 at 22:14:10
```

A 33rd configuration value had been added and compiled before the second of those loads. The count never moved. The build stamp never moved. Three loads, three reported successes, and the new build had never executed once. This is also why the revision export from the boundary section is worth its one line: that log already contained the disproof, and it took a build stamp for anyone to notice.

## Who else holds a reference to your code

Every weak signal in the previous section is a symptom of a single omission. The loader spends all of its effort deciding whether *it* is finished with the module, and never asks who else is.

Hot reload isn't an unload operation. It's an authorisation problem, and the authority isn't the loader.

The holders aren't a long list, and none of them are unusual. Another `LoadLibrary` anywhere in the process, taken by code that has nothing to do with you. A [`GetModuleHandleEx`](https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-getmodulehandleexw) taken without `GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT`, which is easy to write by accident and takes a real reference as a side effect of asking a question. A pinning reference, which by definition nobody can ever release. A static import from another loaded module. A worker that had a counted reference taken for it before it started and then detached instead of being joined. And the interesting one: a reference your own code took on purpose, because it decided that leaking the module would be less bad than unmapping it.

<pre class="mermaid flex justify-center">
graph LR
    subgraph "Who can hold your image"
        direction LR
        L1["Another LoadLibrary<br/>anywhere in the process"] --> MOD;
        L2["GetModuleHandleEx without<br/>UNCHANGED_REFCOUNT"] --> MOD;
        L3["A pinning reference<br/>nobody can ever release"] --> MOD;
        L4["A static import from<br/>another loaded module"] --> MOD;
        L5["A detached worker that<br/>kept its own reference"] --> MOD;
        L6["A reference your own code<br/>took and must never release"] --> MOD;
        MOD["Your logic DLL,<br/>generation N"];
        NOT(["A thread merely executing your code.<br/>This one is the crash, not a pin."]) -. "holds nothing" .-> MOD;
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    classDef mine fill:#282a36,stroke:#8be9fd,stroke-width:2px,color:#8be9fd;
    classDef danger fill:#282a36,stroke:#ff5555,stroke-width:2px,color:#ff5555;
    class L1,L2,L3,L4,L5 default;
    class MOD,L6 mine;
    class NOT danger;
</pre>

Four of the five are solvable by discipline. Audit your own calls, use the unchanged-refcount flag when you're only asking a question, join your threads, don't pin. The first isn't: a `LoadLibrary` taken by code that has nothing to do with you is outside any audit you can run, and the probe below is the only thing that will tell you it happened. The sixth isn't solvable at all, and it splits into two classes where holding the reference forever is the correct implementation rather than a bug to be fixed.

### Hook chains make your patch somebody else's property

A prologue patch is a link in a chain, not a private field.

When you hook a function, you save the first few bytes of its prologue and write a jump in their place. When somebody else hooks the same function afterwards, they do exactly the same thing, except that the bytes they save as "the original" are *your* jump. They now own the prologue, and your patch has become part of their forward path. That isn't hostile, it's what hooking is, and it's precisely what you did to whoever was there before you.

The consequence lands at teardown, and it's the strongest single argument in this post. If you restore your saved pre-hook bytes over that prologue, you've overwritten the newer layer's entry point with bytes that route around it, so their hook silently stops working. Then you free your own trampoline, which the newer layer's live chain still jumps into, because their trampoline ends in a jump to yours. That's an executable-memory use-after-free on a hot game thread. The crash dump names their module, at a time unrelated to your teardown, and never names you.

So the only safe move at teardown is to refuse. Classify the prologue before writing to it, rather than assuming you still own it. If the bytes aren't the ones you wrote, you're not topmost, the chain above you is live, and the correct action is to leave every byte in place, keep your trampolines allocated, and hold your module reference forever. Refusing costs you a permanently mapped image. Not refusing costs somebody else a crash they can't debug.

This is the common case rather than an exotic one. The most widespread instance on Windows is a storefront overlay that layers on the gamepad input entry points, which is the default configuration on most machines, so any mod that hooks gamepad input is in a chain rather than alone on a function. Which end of the chain you're on isn't up to you: the other layer may already own the prologue when you install, or it may land on top of you afterwards, and only the second case is the one that can never be torn down.

<pre class="mermaid flex justify-center">
graph TD
    subgraph "When you are not on top"
        CALL["A call reaches the<br/>hooked function"] --> PRO["The prologue<br/>the newer layer owns it now"];
        PRO --> RS["Newer layer's stub<br/>the original it saved is<br/>YOUR patch, not the real bytes"];
        RS --> RD["Newer layer's detour"];
        RD --> RT["Newer layer's trampoline"];
        RT --> YS["Your stub"];
        YS --> YD["Your detour"];
        YD --> REAL["The real function"];
        PRO -. "you restore your<br/>pre-hook bytes here" .-> BREAK["The newer layer still jumps into<br/>a trampoline you just freed"];
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    classDef mine fill:#282a36,stroke:#8be9fd,stroke-width:2px,color:#8be9fd;
    classDef danger fill:#282a36,stroke:#ff5555,stroke-width:2px,color:#ff5555;
    class CALL,PRO,RS,RD,RT,REAL default;
    class YS,YD mine;
    class BREAK danger;
</pre>

One aside for anyone who goes looking, because the obvious method gives the wrong answer. Walking the prologue forward produces a **false absence**: you follow the first jump, land in the newer layer's stolen-bytes stub, don't see your own patch where you expected it, and conclude you were never there. Your jump did survive. It survived inside their stub. Walk the jump graph instead, following both the `E9 rel32` and the `FF 25` rip-relative forms, and descend into stubs that aren't inside any loaded image.

And treat related targets as one unit. If a feature hooks a pair of functions, classify both before restoring either, so you can never publish half a teardown in which one is restored and the other refused.

### Callbacks that outlive their own removal

The second class has no fix at all, and that's the point of it.

Some OS callback registrations can't be quiesced. Removing one stops *future* dispatch and nothing else. The system may already have selected your callback for an event in flight, and there's no API that tells you when the last already-selected one returns. The removal call returning success isn't an answer, because it's answering a different question: it says that no new dispatch will pick you, not that no thread is currently inside you.

Message hooks are the canonical example, and any callback the OS dispatches on threads you don't own is a candidate. If you can't enumerate the threads that might be inside your procedure, and you can't make them tell you when they leave, then there's no instant at which you can prove the procedure is unreachable. There's no clever version of this. The information doesn't exist.

It's worth being concrete about where those registrations come from, because "OS callback" sounds narrower than it is. A timer callback. A threadpool work item. An APC queued against a thread you don't own. An async I/O completion. A COM callback. An entry in an engine's or job system's callback list. A fiber. A raw function pointer the host stored earlier because you handed it one. None of those are exotic, and they all share the property that matters: they were registered outside whatever lifecycle model your teardown walks, so no drain can see them.

That sets the honest scope of every quiescence claim in this post. A drain proves the closure the library owns, given the caller preconditions it documents. It is not a whole-process proof that no pointer into the image exists anywhere, and no library can offer one, because that proof would require enumerating registrations made by code that never spoke to it. Knowing which of the two you're holding is the difference between a scoped guarantee you can build on and a global one you imagined.

Because that information doesn't exist, the only correct implementation takes a module reference *before* the callback can possibly be selected, and never releases it. Before, not after: the window between publishing the registration and taking the reference is a window in which the system can dispatch into a module whose count you're about to try to drop.

```cpp title="illustrative pseudocode - the shape every non-quiescible callback needs" showLineNumbers
// The reference must already exist before the callback can be selected, so
// take it while the module is provably mapped and before publication.
HMODULE self = acquire_self_reference(PinReason::CallbackKeepalive);
if (self == nullptr) { return false; }

const HHOOK published = SetWindowsHookExW(WH_GETMESSAGE, &message_hook_proc, nullptr, target_thread_id);
if (published == nullptr)
{
    // Nothing was ever dispatched, so this one is safe to give back.
    release_self_reference(self, PinReason::CallbackKeepalive);
    return false;
}

// Success is the point of no return. Book the reference as a deliberate
// permanent one and never try to balance it. There is nothing to wait on.
note_permanent_reference(Subsystem::Input);
return true;
```

Failed publication gives the reference back, because nothing was ever dispatched and there's nothing to protect. Successful publication is the point of no return, so the right thing to do is book the reference as a deliberate leak, record why, and never try to balance it.

Then the general lesson, which outlives the specific bug and is worth more than it. That reference is taken once and held forever. It's a **level, not a transition**, and a delta-based instrument can only see transitions. Snapshot your leak counters before teardown, tear down, re-read them, fold the difference into a verdict, and the difference is zero. Not because nothing is pinning the module, but because the pin was booked during initialisation and nothing about teardown touches it. Every published signal comes back clean on a module that will never unmap again:

```text title="every published signal, clean, on a module that never unmapped"
leak counters: unchanged across teardown
teardown pin attribution: none
thread scan: no thread starts inside this module
release call returned success, image still mapped
```

So any instrument you build for this has to report outstanding references as *state*, queried at a moment in time, not as events observed across an interval. It's an easy thing to get wrong and an expensive thing to debug, because a delta instrument isn't silent when it's wrong; it's confidently, specifically wrong, and it'll let you build a complete and internally consistent theory about a mechanism that never ran.

## What a correct loader proves

The principle is one sentence: replace every step whose success signal is weaker than the question with a step that answers the question, and let the answer be allowed to be no.

That rule rests on a bias, and the bias is worth naming once, because every refusal in this post is an instance of it: a false refusal is acceptable, a false authorisation is not. Equivalently, never turn uncertainty into permission. The two errors aren't the same size, so a design that treats them as one thing has already picked the more expensive side. A teardown that answers no when it can't tell costs you a reload you press again. A probe handed no address to test assumes the image is still mapped, and costs a restart. A witness that declines to restore a prologue it can't prove it owns costs an image that stays mapped for the rest of the session. Every one of those prices is paid in address space, in disk, or in a restart, by me, at a moment I chose. The alternative is paid by somebody else, in a module with no visible connection to anything I did. Read the rest of this section as that one sentence applied in specific places, with the costs attached, because none of it is free.

**Unique staged names.** Copy each build to a name that has never been loaded before and load that copy. It kills stale image reuse, it kills the copy-onto-a-locked-path failure because the build output is never the file you mapped, and it kills static-guard replay, all in one move. The costs are real and worth stating: staged copies accumulate on disk, retained ones stay locked because they never unmapped, and your debugger will happily cache the previous generation's symbols and show you the wrong source line while you swear at it.

**A typed verdict across the boundary, not `void`.** Teardown has to be able to say "no, a callback source can still run, keep me mapped". That means a status type with named refusal reasons rather than a boolean. Exactly one value authorises the release. Every other value refuses and names why, because "it refused" and "it refused because a callback is still in flight" lead to different next actions. Those named reasons are precisely what the sleep was throwing away: it collapsed every distinguishable outcome into one elapsed timer. Watch the boundary itself while you're there, because it's easy to build a rich status inside the DLL and then discard it on the way out through a C export that returns zero or one.

**An in-flight counter on every hooked function.** This is the mechanism the sleep was standing in for, and without it the typed verdict above has nothing truthful to report. Each detour increments a counter on entry and decrements it on exit, so at any instant the counter is the number of threads currently inside that detour body. Teardown then runs in a fixed order: retire the hook first, so the prologue no longer routes into you and no new entry can begin, then wait for the counter to reach zero, then free the trampoline. Only that order makes the wait terminate, because a counter you're still feeding entries into is a counter that can stay above zero forever. The wait is bounded, and the deadline expiring is a named refusal reason rather than a timeout to swallow, which is the difference between this and the sleep: the sleep assumed the frames were gone, and this one asks and is allowed to be told no. Be precise about what it buys. It proves quiescence for every path that goes through a prologue you own, and it proves nothing about a callback the system selected before you retired the registration, because that dispatch never passed through a counter of yours. That residue is the whole subject of the section above, and holding a permanent reference is the only answer to it.

**A reference ledger you can query by reason.** Outstanding counted references as state, not as leak events. It has to be readable after the session object is destroyed, from inside a detour, with no allocation and no lock, because those are exactly the conditions under which you need the answer and the obvious implementations are unavailable in all three. Attribution is the part that earns its keep. A single total tells you that you're pinned. A reason tells you whether the pin is one of the few that are inert by design or one that means live code is still reachable, and those two answers lead to opposite decisions. Take the references counted rather than pinned, through the from-address form of the module handle query, so that a matching release can still let the module unload.

**An unmap probe.** The missing oracle, and the cheapest call that distinguishes "the count was decremented" from "the image is gone". Save a code address inside the generation before you tear it down, then ask which module owns that address after the release. One of the export addresses you already resolved at load time serves, captured before you call `Shutdown`.

```cpp title="wait_for_unmap - the call that answers the real question" showLineNumbers
/**
 * @brief Waits until no loaded module owns an old generation address.
 * @return true only when the
 * address becomes unmapped before the deadline.
 */
[[nodiscard]] bool wait_for_unmap(const void *address) noexcept
{
    if (address == nullptr)
    {
        // No probe address means no unmap proof. Report the image as still mapped.
        return false;
    }
    for (DWORD waited = 0; waited < UNMAP_TIMEOUT_MS; waited += UNMAP_POLL_MS)
    {
        HMODULE owner = nullptr;
        if (::GetModuleHandleExW(
                GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS | GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,
                reinterpret_cast<LPCWSTR>(address),
                &owner
            ) == 0)
        {
            return true;
        }
        ::Sleep(UNMAP_POLL_MS);
    }
    return false;
}
```

`UNCHANGED_REFCOUNT` is mandatory there, and it's the whole trick: without it the probe takes the very reference it exists to test for, and a loop that polls would pin the module it's waiting on. Failing to resolve the address is the success condition, not an error. The poll is 10 ms against a 2000 ms deadline, so the worst case is a two-second wait before the loader concludes it lost. A range query against the same address answers the same question, at the cost of a caveat both forms share: if something else later maps over that range, the probe reports "still mapped" for an image that did unmap. That fails safe, a spurious restart-required rather than a spurious success, but it's still wrong and you should know it's there.

**Newest-first hook unwind.** Push order is layer order, so teardown pops back to front. A plain vector of hook handles is wrong by construction here rather than merely risky, because the order its elements are destroyed in is unspecified: you need a container that guarantees it. Get it backwards and a careful library contains the damage by declining the restores that would break a live chain, which is correct and also expensive, because the declining path skips the balancing release. One inverted teardown pins the module for the life of the process and converts a reloadable session into a restart-required one.

**Move the permanent pin off the swappable module.** If a feature must hold a reference it can never release, that reference belongs in the resident loader, which was never going to unload anyway. In practice that means the loader registers the non-quiescible callback once, for the life of the process, and publishes a fixed-width C table of host entry points that a generation receives at `Init`. The generation opens a single lease against that table, polls it for whatever the callback collected, and closes the lease at `Shutdown`. The loader can then probe the lease itself to confirm the generation let go, which is the resident-side check from the sequence above. It's more plumbing than compiling the same code into the logic DLL, and it's the only arrangement that keeps a permanent pin off the image you're trying to replace.

**A retained generation budget.** Some generations will refuse to unmap, and refusing is the correct outcome, so the loader has to be able to hold a bounded number of retained images and then stop. Count them, cap them, and when the cap is reached say restart rather than quietly accumulating address space for the rest of the session. The budget is also a diagnostic. A loader that hits its cap in ten reloads is telling you that something is pinning every single generation, which is a very different report from one that retains a single image early and then never retains another.

And if you'd rather rescue a naive loader than replace it, three lines convert every silent failure in this post into a visible one. Check `FreeLibrary`'s return. Probe a saved code address with the unchanged-refcount handle query and log the result. Log an exported build revision after `Init`. None of that makes the reload correct. All of it makes an incorrect reload say so, which is the difference this whole post is about.

## What it costs

The honest accounting, in the units that matter to somebody deciding whether to build it.

**Code.** Call the naive version 265 lines of loader, 60 of logic-side ceremony and a 10 line boundary header, roughly 335, and an estimate rather than a count, because the naive loop is a shape rather than a checked-in file. A reference implementation of everything in the previous section is a count, measured against [the reference pair](https://github.com/tkhquang/DetourModKit/tree/v4.2.0/examples/staged_reload) named in the closing sections: 521 plus 277 plus 32, exactly 830. About 2.5x. The growth splits about evenly: 256 lines in the loader, 217 in the logic-side teardown, the rest in the header. That split matters more than the total, because the two halves have completely different maintenance profiles. The loader half is the one you write once and stop editing, because nothing in it changes when the features do, though mine is new enough that I'm asserting the shape of that maintenance curve rather than reporting a year of it. The logic-side half is `Shutdown`, which is the file you edit every single generation, so it's a permanent tax on the loop and it's fair to count it as one. Roughly thirty lines that used to be one.

**Steps.** Seven to eight, either way. The count barely moves. What changes is their character: five of the eight are now checks, where before they were actions with discarded return values.

**Wall clock.** Worst case is roughly two and a half seconds to be told no, a 500 ms drain deadline plus up to 2000 ms in the probe loop before it concludes it lost. A reload that succeeds returns as soon as the last in-flight call retires and wins the probe on its first poll, so it still lands in tens of milliseconds and feels exactly like it always did. The developer loop goes from "build, press reload" to "build, press reload, read the verdict line".

**What it's for.** Reload latency is teardown plus the load plus symbol resolution plus re-arming every hook: the tens of milliseconds above when nothing is contended, and hundreds of milliseconds once there are a lot of hooks to re-arm or in-flight callers to drain, bounded above by the same two deadlines, two and a half seconds. That envelope, with the generation's own state cleared at the end of it, fits a whole class of work: iterating an algorithm, a camera behaviour, an input combo, a tuning constant, anything where you want the world preserved, the code replaced, and were going to re-derive your own state from the new code anyway. It doesn't fit a sub-frame edit-and-see loop. If you're iterating a shader and you want the change to appear in the next 16 ms frame, this is the wrong mechanism, and tightening it won't turn it into the right one. Different problem, different machinery, and deciding which one you have before you build any of this is worth more than any line in the accounting above.

**What you give up,** stated without apology. The guarantee that reload works, first and largest, because it's now a request that can be refused and sometimes will be. A finite generation budget, after which the session ends in a restart. A real `Shutdown`, written and maintained, instead of a one-liner. Disk and debugger friction from the unique names. And a versioned fixed-width C protocol across the boundary that you now have to keep in sync.

**What you gain** is easy to undersell. The naive pattern almost always compiles the logic DLL's teardown out under a development define, or ships a `DllMain` that does nothing in the dev build, which means the loop you run 40 times a day never once exercises the path you actually ship. Reverse that and every reload is a test of your real teardown, run by you, dozens of times a day, against the real process, in the real chain, with whatever else the user has injected sitting on top of your hooks. The failure modes get cheap too: a log line naming a reason, rather than a delayed access violation inside a stranger's module three hours later.

So here's the correctness claim, scoped, because an unscoped one would be the same mistake wearing a new coat. Every step that authorises the release now answers the question it gates on, and refusal is representable at each of them. What remains unproved is what no API on this platform will tell you: whether a selected non-quiescible callback has returned. The answer there is to stop asking and hold the reference forever, which is a containment, not a proof. Containment is the right answer for the reason the whole section rests on: leaking an image and freeing code something might still enter are not the same size of mistake, and the bias picks the one paid in address space against a budget I set. Every retention decision in this post is that bias applied.

## How DetourModKit answers it

Everything above is library-agnostic. This part isn't. DetourModKit is my own hooking and input library for Windows game mods, and its version history is worth reading here because it got this wrong first, in the most instructive way available. Each version number below links to the hot-reload guide exactly as that tag shipped it, wrong turns included.

If you just want the code:

*   **GitHub:** [DetourModKit](https://github.com/tkhquang/DetourModKit)
*   **The mod it grew out of:** [Proper Third Person View (TPV Camera)](https://github.com/tkhquang/KCD2Tools/tree/main/TPVCamera)

**[v3.9.0](https://github.com/tkhquang/DetourModKit/blob/v3.9.0/docs/hot-reload/README.md) reloaded cleanly, and that was the problem.** Its window-subclass install took no module reference at all. Its uninstall restored the window procedure whenever it was still topmost. Its XInput teardown had no witness, no retention and no keepalive: it restored unconditionally. So the count reached zero, the image unmapped, globals reset, and the reload worked. Every time. For months.

It's worth being precise about why it survived that run, because the loader isn't what changed. The feature set is. The mod of that era installed inline hooks and read the keyboard, and that was all of it. There was no XInput target, so nothing ever took the retention path that never gives a reference back. There was no message hook, so nothing took the keepalive that gets taken before publication and never released. The window subclass it did use was already unsound, since a later subclasser captures your procedure address permanently, and it was simply never exercised: nothing subclassed after me on that machine, and I never reloaded twice in a session where something had. Underneath all three, the drain race is probabilistic and rare enough to read as noise, which is exactly what lets it survive months of daily use and then land on a stranger's machine. The same loader, not one line changed, run against today's feature set fails on the first reload. What moved was one binding.

What that clean reload bought itself is the two failure classes above, twice over: a use-after-free window against a message still executing inside the detour, and an unconditional overwrite of any rival that had layered on top of its XInput hooks. Where it did pin, it pinned with `GET_MODULE_HANDLE_EX_FLAG_PIN`, which nobody can ever release, from nine call sites across eight files, and one of the nine, the subclass conflict path, booked no ledger event at all. Either way the ledger was a tally of transitions, not a level anyone could read back and ask why the module was unmappable. It shipped unload tests, but not the one that mattered: fourteen cases, two of them real `LoadLibrary`/`FreeLibrary` round trips against a fixture DLL, and not a single assertion anywhere in the suite that an image had actually unmapped. That reload wasn't correct. It was unfalsified, and from the outside those two look identical.

**[v4.0.0](https://github.com/tkhquang/DetourModKit/blob/v4.0.0/docs/guides/hot-reload/README.md) bought correctness with unloadability.** The subclass began taking a counted reference before publication. The XInput teardown grew a witness gate. Both changes are right, and both mean the module can now refuse to unmap, which is the trade this whole post argues for. The expensive part wasn't the pin. It was that the pin was booked as an event during `Init`, so the obvious instrument, a leak-counter delta measured across teardown, read zero on a module that would never unmap again. A level, read by a delta instrument, exactly as described above.

That one cost me most of a day, and what killed the wrong theory was a controlled contrast rather than more reading: a two-DLL spike with a keyboard and gamepad hold combo unmapped cleanly on every reload, and the same host with one wheel binding never did. I'd built a complete theory around a component I could prove takes an unreleased reference, and every fact in it was true. The spike is what showed me the path had never executed.

**[v4.1.0](https://github.com/tkhquang/DetourModKit/blob/v4.1.0/docs/guides/hot-reload/README.md) is where the machinery landed:** counted references attributed by typed reason, the resident wheel host and its backend choice, removal of the window subclass in favour of a thread-scoped `WH_GETMESSAGE` hook, the staged-generation lifecycle proofs, and the reference loader pair whose line counts appear in the accounting above. [v4.2.0](https://github.com/tkhquang/DetourModKit/blob/v4.2.0/docs/guides/hot-reload/README.md) is current.

The concrete pieces, mapped onto the generic list. The witness is [`PatchWitness`](https://github.com/tkhquang/DetourModKit/blob/v4.2.0/src/internal/hook_patch_witness.hpp#L25), four states, and `witness_permits_write` authorises a write only over bytes it can prove are original or its own; both XInput targets are classified before either is restored, so the pair is refused as a unit. The typed verdict is `dmk::prepare_logic_dll_unload_all()` returning [`LogicDllUnloadStatus`](https://github.com/tkhquang/DetourModKit/blob/v4.2.0/include/DetourModKit/session.hpp#L274), six named statuses against a 500 ms drain deadline, of which only `SafeToUnload` authorises `FreeLibrary`. The ledger is [`diagnostics::ModulePinReason`](https://github.com/tkhquang/DetourModKit/blob/v4.2.0/include/DetourModKit/diagnostics.hpp#L98), eleven typed slots with `MessageHookKeepalive`, `XInputKeepalive` and `XInputTarget` among them, read through `module_pin_count(reason)` as one relaxed atomic. And the pin relocation is [`input::Input::WheelBackend`](https://github.com/tkhquang/DetourModKit/blob/v4.2.0/include/DetourModKit/input.hpp#L373), which picks between `MessageHook`, compiled into the swappable image, and `ExternalHost`, driven through a C ABI and owned by the loader.

The rival the generic section deliberately didn't name is the Steam overlay. `gameoverlayrenderer64.dll` layers on `XInputGetState` and on ordinal 100, `XInputGetStateEx`, in the same module, which is the default configuration on most people's machines. Both patched prologues route into stubs inside the overlay itself; in the build I disassembled they sat one relay slot apart in its own table, and those two slots were the only ones whose stolen bytes were themselves an `E9`. That's the tell if you go looking, and it's worth writing down, because walking the prologue forward will cheerfully tell you your patch was never there.

```cpp title="examples/staged_reload/mod_logic.cpp - Shutdown() as a verdict (trimmed)" showLineNumbers
__declspec(dllexport) std::uint32_t DMK_WHEELHOST_CALL Shutdown() noexcept
{
    s_heartbeat.reset();  // stops and joins, off the loader lock

    // The only value that authorizes FreeLibrary. Anything else means a
    // callback source can still run, so the loader keeps this image mapped.
    if (dmk::prepare_logic_dll_unload_all() != dmk::LogicDllUnloadStatus::SafeToUnload)
    {
        return 0;
    }

    (void)clear_generation_hooks();  // newest-first, while the code pages are still mapped
    s_session.reset();               // ordered teardown, and XInput retention happens in here

    // Read the ledger AFTER ~Session, because that is where retention lands.
    // The resident host owns the wheel pin, so this contract is a global zero.
    const std::size_t message_hook   = diag::module_pin_count(diag::ModulePinReason::MessageHookKeepalive);
    const std::size_t xinput_self    = diag::module_pin_count(diag::ModulePinReason::XInputKeepalive);
    const std::size_t xinput_targets = diag::module_pin_count(diag::ModulePinReason::XInputTarget);
    const bool no_pins = message_hook == 0 && xinput_self == 0 && xinput_targets == 0 &&
                         diag::total_module_pins() == 0 && diag::total_intentional_leaks() == 0;

    return !s_hook_restore_failed && no_pins ? DMK_STAGED_RELOAD_OK : 0;
}
```

That global zero is the `ExternalHost` contract: the resident host owns the wheel pin, so a generation running that topology really should have nothing outstanding at its own teardown. In the local `MessageHook` topology the correct verdict is a different one, and demanding a global zero there is a bug. A single-DLL mod accepts the documented inert set instead, `MessageHookKeepalive` plus the XInput retention pair, and refuses every other nonzero reason. A generation that demands global zero in that topology refuses its own reload forever, under a rule that was never written for it.

**Some references are permanent by design, and the ledger has to say so.** `MessageHookKeepalive` is permanent from the first successful publication of the message hook. `XInputKeepalive` and its paired `XInputTarget` references are permanent whenever retention triggers, because refusing to restore a foreign prologue means keeping the trampolines alive forever. What that costs is a policy question, and the answer depends entirely on the loader. Under a naive same-name loader, a mod that has ever bound the wheel gets zero real reloads after the first pin: every press from then on is theatre. Under a staged loader the same mod stays repeatably reloadable, at a bounded number of retained images and roughly 3.5 MB each. The pin placement is correct in all of those cases. The defect was never the pin. It was that nothing could ask why a module was unmappable, so you inferred it from a crash three hours later.

The boundary makes a deliberate choice about that typed verdict, and it is the trade the boundary section opened with. The reference pair's `Init` and `Shutdown` return a `std::uint32_t` that is only ever `DMK_STAGED_RELOAD_OK` or zero, so the six-value status does its work inside the DLL and the loader is told only whether it may proceed. Carrying the reason across is one appended field, and every change to that protocol is a loader rebuild and therefore a process restart, which is the cost the whole boundary is shaped to avoid. A demo is the wrong place to spend it. A consumer that wants the refusal reason in the loader's log rather than the generation's appends the field once and pays the restart once.

## The same architecture in a shipped mod

Related: <a href="/blog/posts/devlog-kingdom-come-deliverance-ii-building-a-proper-third-person-camera" target="_blank" rel="noopener noreferrer">[Devlog] Kingdom Come: Deliverance II - Building a Proper Third Person Camera</a>

The reference pair is a demo. TPVCamera, my third-person camera mod for Kingdom Come: Deliverance II, is the consumer that has to live with the result. [PR #32](https://github.com/tkhquang/KCD2Tools/pull/32), merged as commit [`20e6394`](https://github.com/tkhquang/KCD2Tools/commit/20e6394fb378ded7c273e4021306c6635b4996cc), migrated it to v4.2.0 and reworked [its dev loader](https://github.com/tkhquang/KCD2Tools/tree/20e6394fb378ded7c273e4021306c6635b4996cc/TPVCamera/src/dev), after a v4.0.0 migration and a v3.9.0 one before that.

The size is the first honest number. Loader, logic and boundary header come to 559 plus 283 plus 58 lines, about 900 against the reference pair's 830, so the accounting above transfers nearly unchanged. The machinery doesn't get cheaper for being yours.

The loader maps a unique per-generation copy, `Mod.genNNNN.logic.dll`, and never the build output, because mapping the build output locks the path a rebuild has to write to. It links `DetourModKit::WheelHost` only, never the full archive, with CMake asserting both. It keeps its own append-only log, separate from the mod's, because the mod's log belongs to a `Session` that dies with each generation and the interesting records are the ones written during teardown.

And it retires a generation on proof: typed `Shutdown`, host lease probe, one `FreeLibrary`, then a *polling* address-unmap check, because a release can complete after `FreeLibrary` has already returned. One deliberate difference from the reference pair. This loader waits 100 ms between the lease probe and `FreeLibrary`, covering a game thread already inside a per-frame detour body; those bodies return in microseconds, and the reference pair, whose hooked function has exactly one caller and joins it before teardown, needs no such wait. The wait is a margin rather than a bound, which is exactly why it sits in front of the proofs instead of in place of them: the typed verdict still has to accept, the lease still has to be provably closed, and the saved address still has to stop resolving before anything is called gone. Paying 100 ms ahead of proofs that still have to pass is a different thing from paying it instead of them, and that difference, not the duration, is what the sleep section above was about.

The detail that closes this post's complaint about dev and release divergence is one parameter. `TPVCamera::init` takes the resident wheel-host table as an argument, and `nullptr` selects the local `MessageHook` backend. So the release build and the dev pair share one feature code path with no `#ifdef` deciding the backend. One macro survives, `TPVCAMERA_DEV_BUILD`, and it draws the line the two-binary split requires rather than one a refactor could remove: it compiles the production `DllMain` out of the dev logic DLL, because in the split the loader owns the entry points and calls `Init` and `Shutdown` itself. `TPVCamera::shutdown()` is the same function on both sides of that macro, so every reload does exercise the real teardown. What a reload cannot exercise is `DLL_PROCESS_DETACH`, and no reload loop anywhere can, because a reload is not a process detach. That is the edge of what this technique tests, not a leftover: the entry point is a property of which binary you are, and the split makes you two.

The measured result, in [the migration commit's own words](https://github.com/tkhquang/KCD2Tools/pull/32/commits/f284c4ddc4a4fd148d5cde508d0ffecc9fff0038): "new bytes load each reload, every generation unmaps cleanly, and wheel bindings work in every generation." Read that as scoped to the run it describes, which is one in which nothing hit retention.

Under the Steam overlay it behaved better than I expected, and the mechanism took me a while to see. Retention attaches to the image a rival layered *on top of*, not to every generation that installs, so whichever generation was live when the overlay reached those exports is the one that witnesses foreign bytes and refuses. Every generation after it installs *above* the overlay's chain, is still topmost at its own teardown, witnesses bytes it can prove are its own, restores them, and unmaps. In my sessions that meant at most one retained image, nowhere near the 24-generation budget in [`k_max_retained_generations`](https://github.com/tkhquang/KCD2Tools/blob/20e6394fb378ded7c273e4021306c6635b4996cc/TPVCamera/src/dev/mod_loader.cpp#L62). I wouldn't state it more strongly than that: retention has two other triggers that have nothing to do with a rival, an in-flight detour at the quiesce deadline and an install that couldn't be proved, and either can retain a later generation.

Which produces the recommendation I'd give anyone standing where I was: **if you play through Steam and you bind the wheel, host wheel capture in the loader.** The two permanent references have different shapes, and that difference is the whole decision. The wheel keepalive is taken fresh by every image that publishes its own message hook, so it costs a leaked image per reload and grows for as long as the session lasts. XInput retention is a one-time constant, paid once by whichever generation was live when the overlay arrived. `ExternalHost` removes the growing one by parking it on the module that never unloads, and the one it leaves behind doesn't grow.

## When it's worth building

For a mod that installs a few inline hooks and reads the keyboard, no, and I don't want to sell machinery to somebody who doesn't need it. The ledger will read zero every time. The image will unmap every time. A much simpler loader is safe in practice and unproved in exactly the one step this post is about, and unproved isn't the same thing as broken.

The reason to build it anyway is that nothing in the simple design tells you the day you crossed the line. One wheel binding or one consume-gamepad binding can move a module from unmappable-on-demand to permanently pinned, with no compile error, no runtime error, and no log line a naive loader ever reads. The loader doesn't change. The feature set does, and the loader has no opinion about that.

This post has spent a lot of words demanding proof, so here's mine, and you can open it yourself. [`Lifecycle.StagedGenerationSoakReloadsWithFreshBytes`](https://github.com/tkhquang/DetourModKit/blob/v4.2.0/tests/lifecycle/staged_generation_soak.cpp), registered in [`tests/lifecycle/CMakeLists.txt`](https://github.com/tkhquang/DetourModKit/blob/v4.2.0/tests/lifecycle/CMakeLists.txt), runs 100 generations through the resident host. Each cycle rewrites a tag byte range inside the staged copy before loading it, then `memcmp`s that tag after the load. A generation that comes back as a still-mapped predecessor carries the previous tag and fails the test, rather than passing quietly the way the log line did. That's this whole post in the smallest form I could write it down: the image that loaded has to prove it's the one that was just built.

---

The old loader wasn't wrong because it crashed. It was wrong because it couldn't be wrong. Every signal it read was true, every step returned what it promised, and none of them were the question. That's a worse place to be than a loud failure, because a loud failure at least points somewhere.

The reload still fails sometimes. The difference is that now it says so, and I go and read the reason instead of inventing one. I still press the key twice out of habit; the control thread that reads the key is the one running the cycle, so a press that lands mid-cycle is never sampled at all, and the verdict line I read afterwards belongs to the cycle already under way.
