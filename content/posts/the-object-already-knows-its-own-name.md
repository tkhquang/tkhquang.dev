---
title: "The Object Already Knows Its Own Name"
created_at: 2026-06-10T00:00:00.000Z
updated_at: ""
published: true
category_slug: technical
tags:
  - C++
  - Modding
  - Reverse Engineering
  - RTTI
  - DetourModKit
  - Crimson Desert
  - Windows
cover_image: /uploads/images/blog/rtti-self-heal-cover.webp
description: "A bug report from my modding idol grew into RTTI self-heal: mods that re-find their own offsets."
---

My least favourite part of native modding is <a href="/blog/posts/hot-reload-in-a-live-process-the-two-binary-architecture" target="_blank" rel="noopener noreferrer">the loop</a>. My second least favourite part is patch day, because patch day is the loop with the difficulty turned up: the game updates, the compiler reshuffles a struct, every hard-coded offset in the mod now reads garbage, and the first you hear of it is a user report that just says "broken".

The usual fix is archaeology. Attach a debugger, find where the field went, update a constant, rebuild, ship. Every patch, for every offset, forever.

This post is about the GitHub issue that changed how I deal with that, and about the RTTI self-heal module in [DetourModKit](https://github.com/tkhquang/DetourModKit) that grew out of it: instead of me re-deriving the offsets after a patch, the mod scans for its own fields, recognises them by type name, and re-derives the offsets itself. Fail-closed, at init time, with a drift report at the end.

If you just want the code:

*   **GitHub:** [DetourModKit](https://github.com/tkhquang/DetourModKit)
*   **The design doc:** [RTTI self-heal](https://github.com/tkhquang/DetourModKit/blob/main/docs/guides/rtti/rtti-self-heal.md)
*   **The issue that started it:** [CrimsonDesertTools #46](https://github.com/tkhquang/CrimsonDesertTools/issues/46)

## An issue from the person on my credits list

On May 2nd, a Crimson Desert patch broke my transmog mod, and an issue appeared in [CrimsonDesertTools](https://github.com/tkhquang/CrimsonDesertTools) titled "Fix for Transmog for patch 1.00.5". Routine, except for the name on it: **[Frans Bouma](https://github.com/FransBouma)**. Otis_Inf. The person behind the [Injectable Generic Camera System](https://github.com/FransBouma/InjectableGenericCameraSystem) and the photomode camera tools half the virtual photography community runs on, and the reason I got into camera modding in the first place. His name has been sitting in [my first mod's credits](https://github.com/tkhquang/KCD2Tools/tree/main/TPVToggle) since the day it shipped: *"for his camera tools and inspiration"*.

![Issue #46, opened by the person my credits list calls "inspiration"](/uploads/images/blog/rtti-self-heal-issue-46.png)

He wasn't there to report the breakage. He was there to hand me the fix. He'd been updating his own camera tools for the same patch, so he had two binary dumps open to compare, and while he was in there he diffed my mod's dead signature against the new build and posted the replacement pattern. And he did check EquipHide, as promised: the byte patterns for that mod arrived thirteen minutes later.

I saw it a few hours late because GitHub didn't notify me, which was probably for the best, because my reply was not composed and a real-time one would have been worse 😅 Somewhere further down the thread he mentioned that the last time he used a makefile was 1994 on SunOS, which is one year before I was born. Idols do that to you: make you feel encouraged and thoroughly outclassed in the same comment.

## The same failure, three ways

The issue never really closed. It turned into a running conversation across patches, and reading it back, it's a catalogue of the ways a binary drifts out from under a mod. Three entries matter for this post.

**A field moved four bytes, and a code signature died of it.** The EquipHide fix he posted is my favourite kind of diff, because exactly one byte changed:

```text title="EquipHide's hook-site AOB, before and after the patch"
old:  48 8B 45 5F 0F B6 40 1C 3C 03
new:  48 8B 45 5F 0F B6 40 20 3C 03
                           ^^
```

That `0F B6 40 1C` is `movzx eax, byte ptr [rax+0x1C]`. The code didn't change at all. A struct member above `+0x1C` got added (or grew), the field slid to `+0x20`, and because x86 bakes the displacement into the instruction bytes, the *data* drift killed the *code* signature. This distinction took a while to fully land for me: a lot of what we call "AOB rot" is layout drift wearing a code costume.

**A register allocation changed, and every byte touching it changed with it.** Patch 1.00.6 broke a feature because the compiler now kept a loop pointer in `rdi` where the old build used `rsi`. Frans posted the full disassembly of the new site, annotated, with a `<<<< HERE` marking the instruction. You cannot pattern-your-way around a register rename; the pattern *is* the register.

**A pointer field moved, again.** By June he opened with *"Was gonna mention UserActor is now at offset 0x58 but you already fixed it :)"*. The second layout shift in five weeks of one issue thread.

Somewhere in the middle of all this I wrote the sentence that became the actual work: *"I think I'll need to step back and find a more reliable way to identify the currently controlled character rather than chasing the AOB."* And Frans, in passing, pointed at the answer: he works with x64dbg, Cheat Engine, and RTTI dumpers, because *"the game has a lot of RTTI types exposed, which give you a nice opportunity to get the instances."*

Then in June he came back with a present: [CERTTIExplorer](https://github.com/FransBouma/InjectableGenericCameraSystem/tree/master/Tools/CERTTIExplorer), a live RTTI explorer script for Cheat Engine that a friend of his had written and he'd fixed up. Among the things he added: a **reverse range lookup**. Point it at an address, give it a range, and it identifies every RTTI-typed instance in that block. His words: *"Super handy for blocks of pointers."*

That one feature is the whole idea. The rest of this post is me taking it apart and wiring it into the mod itself.

## RTTI, briefly

RTTI is C++'s run-time type information: the records the compiler emits so that `dynamic_cast` and `typeid` can work. MSVC generates them for every polymorphic class unless a build explicitly turns them off. Some engines do turn them off (Unreal ships with RTTI disabled), but this game's engine didn't, which means a shipped, symbol-stripped binary still carries the class name of every polymorphic type in it, reachable from any live object in four hops:

```text title="the MSVC x64 walk, from object to name"
object          --> first qword is the vptr
vtable[-1]      --> RTTICompleteObjectLocator (COL)
COL + 0x0C      --> RVA to TypeDescriptor
td  + 0x10      --> the mangled name, e.g. ".?AVHealthComponent@game@@"
```

<br />

<pre class="mermaid flex justify-center">
graph TD
    subgraph "Every polymorphic object can be asked its name"
        OBJ["A live object<br/>first qword: the vptr"] --> VT["vtable"];
        VT -->|"one qword before it: vtable[-1]"| COL["RTTICompleteObjectLocator<br/>signature, offset, pTypeDescriptor, pSelf"];
        COL --> CHK{"does col_addr - pSelf<br/>reconstruct the owning<br/>module's base?"};
        CHK -- no --> REJ["forged or relocated<br/>rejected, fail closed"];
        CHK -- yes --> TDESC["TypeDescriptor"];
        TDESC --> NAME["mangled name<br/>.?AVHealthComponent@game@@"];
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    classDef pass fill:#282a36,stroke:#50fa7b,stroke-width:2px,color:#50fa7b;
    classDef refuse fill:#282a36,stroke:#ff5555,stroke-width:2px,color:#ff5555;
    class OBJ,VT,COL,CHK,TDESC default;
    class NAME pass;
    class REJ refuse;
</pre>

On x64 the COL's pointers are RVAs relative to the *owning module's* image base, and the structure helpfully carries a `pSelf` RVA pointing back at itself, so a walker can cross-check that `col_addr - pSelf` reconstructs the module base the loader reported, and reject anything forged or relocated. DetourModKit already shipped [a walker](https://github.com/tkhquang/DetourModKit/blob/main/docs/guides/rtti/rtti-walker.md) that does this forward question: *given a vtable, what type is this object?* I'd been using it to verify pointers before chasing offsets through them.

CERTTIExplorer's range lookup asks the question backwards, and backwards is where it gets interesting: *given a block of memory, what objects live here?* Read a qword, treat it as a pointer, resolve the pointee's vtable, walk to the name. Repeat for every slot in the block. A struct full of anonymous pointers turns into a labelled table.

Here's why that matters for patch day. **Offsets drift. Names don't.** A patch that inserts a member slides every field below it by a few bytes, but the object on the far end of the moved pointer still spells out its own class name at `vtable[-1]`. The thing my mod hard-codes is the thing the patch changes, and the thing the patch preserves is a thing my mod never looked at.

## From a tool you run to a thing the mod does

After a patch, my manual recovery ritual looked like this: attach Cheat Engine, run the explorer over the struct, read the labelled slots, spot that the `HealthComponent` pointer is now 8 bytes further down, fix the constant, rebuild. Every step of that is mechanical. Every mechanical ritual is a program you haven't written yet.

So DetourModKit grew [`rtti_dissect`](https://github.com/tkhquang/DetourModKit/blob/main/docs/guides/rtti/rtti-self-heal.md), and the core of it is one record and one function. The record is a **landmark**, written down once, while the mod works.

**At offset `O` within struct `S` there is a pointer to an object of mangled type `T`.** That single sentence is the entire contract.

```cpp title="a landmark, recorded once in mod code" showLineNumbers
const rtti::Landmark k_health_ptr{
    .nominal_offset   = 0x2A0,
    .window           = 0x40,
    .expected_mangled = ".?AVHealthComponent@game@@",
};

// At init, or after a field read returns garbage:
rtti::Landmark lm = k_health_ptr;
lm.base = resolved_player_struct;  // from the usual AOB / scan cascade
if (const auto hit = rtti::heal_landmark(lm))
    player_health_offset = hit->healed_offset;
else
    log().warning("health landmark lost ({}); binary changed too much -- re-author it",
                  hit.error().message());
```

`heal_landmark` is the function, and it does the ritual: check the nominal slot first, and if the layout didn't drift, return immediately. Otherwise step outwards through the window around `base + 0x2A0`, pointer-aligned, nearest slot first, reverse-identifying each one, until it finds the slot whose pointee's mangled name is byte-for-byte `T`. The matched slot's offset is the healed offset. The patch moved the field; the mod noticed and followed it.

<pre class="mermaid flex justify-center">
---
config:
  flowchart:
    nodeSpacing: 24
---
graph TD
    subgraph "heal_landmark, allowed to say no"
        START["heal_landmark(lm)"] --> VAL{"descriptor<br/>valid?"};
        VAL -- no --> BAD["BadDescriptor<br/>no memory touched"];
        VAL -- yes --> NOM{"nominal slot<br/>still resolves<br/>to T?"};
        NOM -- yes --> OK0["healed_offset ==<br/>nominal, the layout<br/>did not drift"];
        NOM -- no --> SCAN["step outwards by<br/>stride, nearest first,<br/>within the window"];
        SCAN --> N{"matches?"};
        N -- none --> NM["HealNoMatch<br/>never the nominal<br/>as a guess"];
        N -- "one uniquely<br/>nearest" --> OK1["healed_offset =<br/>nominal ± d<br/>the field moved,<br/>we followed"];
        NM ~~~ AMB["HealAmbiguous<br/>a tie never guesses"];
        N -- "+d / -d<br/>at a tie" --> AMB;
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    classDef pass fill:#282a36,stroke:#50fa7b,stroke-width:2px,color:#50fa7b;
    classDef refuse fill:#282a36,stroke:#ffb86c,stroke-width:2px,color:#ffb86c;
    class START,VAL,NOM,SCAN,N default;
    class OK0,OK1 pass;
    class BAD,NM,AMB refuse;
</pre>

Two design decisions carry the whole thing, and both came out of getting burned rather than out of foresight.

**Cache the offset, never the address.** The heal returns a `std::ptrdiff_t` relative to the struct base, not an absolute pointer. An address dies with the instance; the offset survives across instances, saves, and sessions, because it's a property of the *layout*, and the layout is what the patch changed.

**Fail closed, everywhere.** Zero matches is `HealNoMatch`, not "shrug, use the old offset". A slot on an unmapped page is a skipped slot, not a crash: every read is SEH-guarded and range-checked against the owning module. A forged COL fails the `pSelf` cross-check and is skipped. And when a match at `+d` ties with a match at `-d`, that's `HealAmbiguous`, because **a tie never guesses**. Every one of those outcomes reads better in a log than the alternative, which is a mod that confidently reads the wrong memory and does something creative with it.

## The ways it can still be wrong

A post that only tells you the happy path is an advertisement, so here is where the sharp edges live.

**The nearest match wins, and "nearest" is not "right".** If a patch introduces a *second* field of the landmark's type strictly nearer to the nominal offset than the real one, the heal resolves to the decoy, silently, and returns a confidently-wrong offset. `HealAmbiguous` only fires on an exact distance tie. This is the module's one documented fail-wrong hazard, and the mitigation is honest rather than clever: keep the window tight, tighten the type, or use a fingerprint (below) whenever the window could plausibly hold two fields of the same type.

**Multiple inheritance can put the right name at the wrong offset.** Under MI, each base subobject carries its own vtable, and every one of those vtables' COLs names the *same* most-derived type. Only `COL.offset`, the subobject's displacement within the complete object, differs. So a heal that accepts a direct object base can match a *secondary* base and report an offset that's `COL.offset` bytes into the object. The nastiest version: an upstream member removal lands a secondary base's vtable exactly on the old nominal offset, and the heal reports "didn't move" while pointing into the middle of the object. The fix is a stricter shape filter (`CompleteObject` accepts only `COL.offset == 0`), and the `HealHit` reports the matched `col_offset` so a consumer can audit what it accepted.

**Dense regions need a rigid template, not a nearest match.** When several fields co-move (and they do, because one inserted member shifts everything below it by the same delta), `solve_fingerprint` records several landmarks and demands that **one uniform delta fit all of them**:

```cpp title="several fields, one delta" showLineNumbers
const std::array<rtti::Landmark, 3> k_player_fp{{
    {.nominal_offset = 0x2A0, .expected_mangled = ".?AVHealthComponent@game@@"},
    {.nominal_offset = 0x2C0, .expected_mangled = ".?AVInventory@game@@"},
    {.nominal_offset = 0x300, .expected_mangled = ".?AVStats@game@@"},
}};

if (const auto fit = rtti::solve_fingerprint(player_base, k_player_fp, 0x40))
{
    health_offset    = 0x2A0 + fit->delta;
    inventory_offset = 0x2C0 + fit->delta;
    stats_offset     = 0x300 + fit->delta;
}
```

A decoy now has to fake three types at three exact relative positions, which stops being a coincidence and starts being a conspiracy. The fingerprint is also stricter about doubt than the single-landmark heal: any second *non-zero* delta that fits the whole template fails `HealAmbiguous`, no equidistant tie required. The one reading that wins a tie outright is `delta == 0`: when the anchor still validates every landmark, the object is exactly where you left it, and the solve says so.

## Running it while the game is still loading

A heal that only runs at init has a bootstrapping problem: at init, half the interesting objects don't exist yet. The struct you want to landmark is constructed after a save loads, or after a menu closes, or whenever the engine feels like it. So the module ships a small driver, `HealScheduler`, that runs the heals on a frame cadence and captures the discipline every self-healing mod hand-rolls eventually: a fixed retry interval (default every 30 frames, roughly half a second at 60 FPS), an optional per-frame *gate* so a target that isn't constructed yet is skipped cheaply without spending the retry, a per-group latch so a heal that succeeded stops being re-run, and no attempt cap, because a loading screen takes as long as it takes.

The part I care most about is the warning it emits, because it's the honest one. When a heal detects real drift, the scheduler fires a single process-wide warning, once, and what that warning actually means is this: **the pointer fields healed themselves, and the scalar fields didn't.** A layout shift that moved the `HealthComponent` pointer by 8 bytes also moved every float, flag, and counter below the same inserted member, and those carry no vtable, no COL, no name. RTTI can't see them. The one-shot warning is the machine telling the human: I fixed what I could identify, the rest rode the same shift, come verify.

And because a heal that ran is a diff that happened, `heal_report` turns a landmark set into a machine-readable drift table (per field: nominal, healed, delta, or the error if it failed) that can be serialised and diffed across game versions. A patch's re-layout becomes a changelog entry instead of a debugging session.

One deliberate absence: there is no persisted, user-editable "offsets file" that feeds back into resolution. The drift manifest is an archive for analysis, never a heal input. A hand-edited offset reads the wrong memory exactly as confidently as a right one, and the whole point of this module is that confidence has to be earned per run.

## What it doesn't fix

Scoped claims, because the alternative is selling machinery I'd have to apologise for later.

**Code sites still break the old way.** The `rsi` → `rdi` rewrite from the issue is untouchable by any of this: self-heal recovers *data layout*, and a hook site whose register allocation changed needs a re-authored signature, full stop. Even the EquipHide case, where the root cause *was* data drift, still needs its AOB re-authored by a human; the drift report just hands you the `+4` as a head start instead of a mystery.

**The landmark type has to survive the patch.** Matching is byte-exact on the most-derived mangled name, so a landmark keyed on a game-specific subtype dies the day that subtype is renamed. It fails closed as `HealNoMatch`, but it fails. Key landmarks on stable engine or base types, the names that would break the *game's own* content pipeline if they changed.

**It's an init-time tool, not a per-frame one.** Identifying one slot costs up to two `GetModuleHandleEx` lookups (a user-mode walk of the loader's module list, loader lock and all), so a full window scan runs that walk thousands of times. The window is capped (4096 bytes, 512 slots each side) so the worst case is bounded, but the contract is init-time and re-heal-on-miss, driven by the scheduler, never a hot path.

What I like most about the failure story is that it's *one* story. The scan cascade that resolves the struct base fails closed with `NoMatch`; the heal that resolves fields inside it fails closed with `HealNoMatch` or `HealAmbiguous`; and all three read the same way in a log: the binary changed too much, a human needs to look. The mod never guesses on my behalf. It just tells me exactly where to start digging, which, compared to the archaeology this post opened with, is most of the job.

## Credits, the load-bearing kind

The reverse-direction design was inspired by CERTTIExplorer, and that tool has its own lineage, which deserves spelling out: it was originally written by [GhostInTheCamera](https://github.com/ghostinthecamera), building on the [FramedSC RTTI guide](https://framedsc.com/GeneralGuides/using_rtti.htm) (itself distilled from Hatti's video), with COL-validation refinements credited to etra. Frans fixed it up and added the reverse range lookup that set this whole post in motion. DetourModKit's module is an independent C++ reimplementation of the same well-documented MSVC RTTI walk, no code copied; what I took were the ideas (the reverse block scan, the range lookup, the `COL.offset` handling for multiple-inheritance subobjects) and the nudge to build them into something that runs without a human at the keyboard.

Thanks, Otis. For the AOBs, for the tool, and for the camera mods that started all of this years before you knew I existed 🙏

---

There's a version of this story where the takeaway is the module: record landmarks, heal on load, read the drift report, ship faster. That's the useful version and I stand by it.

But the version I keep thinking about is the other one. A year and a half ago I typed a stranger's handle into a credits file. This spring he walked into my issue tracker with the fix already diffed, stuck around through three patches, and handed me the idea that became my favourite part of my own toolkit. He also wrote that my mods *"do what they have to do without convoluted UIs or other crap"*, which I'm considering having engraved. The offsets will move again. Guaranteed. The difference is that now the mod notices before my users do, and when it can't heal, it says so and points.

The KCD2 devlogs were about <a href="/blog/posts/devlog-kingdom-come-deliverance-ii-finding-the-third-person-view-toggle-flag" target="_blank" rel="noopener noreferrer">finding the flag</a>. This one is about the name. Next patch, the mod does the asking.
