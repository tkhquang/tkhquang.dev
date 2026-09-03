---
title: "[Devlog] Kingdom Come: Deliverance II - Building a Proper Third Person Camera"
created_at: 2026-06-06T00:00:00.000Z
updated_at: 2026-08-28T00:00:00.000Z
published: true
category_slug: technical
tags:
  - CryEngine
  - "Kingdom Come: Deliverance II"
  - Modding
  - Devlog
  - Reverse Engineering
  - C++
  - Camera
cover_image: /uploads/images/blog/tpv-camera-1.webp
series: Third Person Camera
series_part: 3
description: "Building a 'proper' third-person camera for Kingdom Come: Deliverance II - One that does not suck."
---

One more trip under the hood of **Kingdom Come: Deliverance II**, and this one closes a loop I opened over a year ago.

This one builds on two earlier devlogs:

*   <a href="/blog/posts/devlog-kingdom-come-deliverance-ii-finding-the-third-person-view-toggle-flag" target="_blank" rel="noopener noreferrer">[Devlog] Kingdom Come: Deliverance II - Finding the Third-Person View Toggle Flag</a>, where I went hunting for the built-in third-person flag, found it in the camera manager, and flipped it.
*   <a href="/blog/posts/devlog-kingdom-come-deliverance-ii-customizing-the-view-tpv-offsets-input-and-whats-under-the-hood" target="_blank" rel="noopener noreferrer">[Devlog] Kingdom Come: Deliverance II - Customizing the View: TPV Offsets, Input, and What's Under the Hood</a>, where I bolted offsets, sensitivity and pitch limits on top of it, because the community wanted an over-the-shoulder view.

Both mods run on the same idea: borrow the game's own debug third-person camera, switch it on, and patch around whatever it breaks.

That idea has a ceiling, and I spent the better part of a month bumping into it. Eventually I stopped patching, threw the approach out, and rebuilt the camera from the opposite direction. The rewrite took roughly two weeks and it's a genuinely better camera, which is either encouraging or slightly annoying depending on how you look at it.

The new mod is called **Proper Third Person View (TPV Camera)**. If you just want to play with it:
*   **NexusMods:** [Proper Third Person View (TPV Camera)](https://www.nexusmods.com/kingdomcomedeliverance2/mods/3263)
*   **GitHub:** [KCD2Tools](https://github.com/tkhquang/KCD2Tools)

Here's what it looks like in motion. Please forgive the video quality and the frame rate:

https://www.youtube.com/watch?v=NuCQHDoQnVE

## Why I started over

The old mod's biggest complaint never really had a fix: **the crosshair lies to you**. Every aiming and interaction ray in the game is cast from the first-person eye and look direction. The debug camera moves the picture somewhere else without moving those rays, so what's in the middle of your screen and what Henry is actually pointing at drift apart. Adding a shoulder offset only widened that gap, which means my "improvement" made the underlying problem worse. Oops.

Behind that sat a culling problem. The built-in camera does its own thing with the view frustum, and there's control logic in that path I never got a proper handle on. Things close to the camera would disappear or show up late, and from outside the subsystem all I could do was guess and re-test. I won't pretend I understood it, because I didn't.

Then there was everything else. Menus, dialogue, cutscenes, horseback, the scroll wheel. Each needed its own workaround hook, and every workaround made the next one harder to write.

Eventually the pattern got obvious. I wasn't fixing bugs, I was arguing with a subsystem doing exactly what it was built to do. That camera is a developer tool. It was never meant to be the camera you play with, and patching it from the outside was never going to change that.

So instead of asking what else I could patch, I asked a different question: what if I never turn that camera on at all?

## Rewriting the sink, not the source

Here's the idea the whole rewrite is built on, and it's simpler than it sounds.

The engine's data flows one way. The active camera computes a pose, the pose lands in the player's `CView`, and `CView` turns it into the camera the renderer uses. Gameplay never reads that render camera. Aiming, interaction and combat all read the player's eye and look-direction channel, which is the **source** feeding the first-person camera. The render camera is the **sink** at the end of the pipe.

<pre class="mermaid flex justify-center">
---
config:
  flowchart:
    nodeSpacing: 32
---
graph TD
    subgraph "The engine's one-way camera pipeline"
        IN["Mouse / gamepad input"] --> SRC["Player look-direction<br/>and eye channel<br/>THE SOURCE"];
        SRC --> CAM["Active camera Update()<br/>first person, dialogue,<br/>horse, UI"];
        CAM --> POSE["CView pose"];
        POSE --> SINK["Render CCamera matrix<br/>THE SINK"];
        SINK --> OUT["Cull planes,<br/>then the renderer"];
        SRC -.-> READS(["Aim, interaction<br/>and combat read here.<br/>We never touch it,<br/>so they never notice."]);
        SINK -.-> WRITES(["The mod rewrites this,<br/>once per frame.<br/>Nothing downstream<br/>reads anything else."]);
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    classDef reads fill:#282a36,stroke:#50fa7b,stroke-width:2px,color:#50fa7b;
    classDef writes fill:#282a36,stroke:#8be9fd,stroke-width:2px,color:#8be9fd;
    class IN,SRC,CAM,POSE,SINK,OUT default;
    class READS reads;
    class WRITES writes;
</pre>

So don't replace the source. Rewrite the sink.

We leave the game in first person and never touch that flag. The manager keeps switching to the dialogue camera, the UI camera, the horse camera, exactly as it always has. We just grab the final render pose each frame and move it back over the player's shoulder.

Aim and interaction never notice, because nothing they read was touched. Dialogue and cutscenes keep working, because we're not fighting the manager for them anymore. And the body-follows-camera turning is gone, because that behaviour belongs to the third-person path we never enter. Free-look orbit is the one exception, since there I ask the body to turn on purpose, and getting *that* to behave took a couple of patch releases of its own.

You go from "override an entire subsystem and suppress its side effects" to "add a transform to one pose every frame." That's the whole design.

## Finding the right place to write

Knowing what to rewrite still leaves the question of where, and I got that wrong twice.

The obvious spot is the camera's own `Update`, but it falls apart fast. Fifteen camera types share `C_Camera::vtable[1]`, so you can't hook them one at a time and hope to cover them all. And they aren't independent: `C_CameraRider::Update` calls `C_CameraFirstPerson::Update` directly. Hook both and the offset applies twice. Hook one and horseback breaks.

My second attempt cost two live tests and a bruised ego. `CView::Update` receives the pose, so I hooked it and wrote my offset into the `SViewParams` fields, position at `+0x14` and rotation quaternion at `+0x20`. The hook installed. The log confirmed it ran every frame. The view didn't move a millimetre. I wrote the source copies too. Still nothing. Whatever the renderer ends up using, it isn't read back out of those fields.

The third attempt shipped. `CView::Update` builds an embedded render `CCamera` as a 3x4 matrix at `CView+0xE8`, then tail-calls the frustum builder, `CCamera::UpdateFrustumPlanes`. That builder is pure math: camera matrix in, world-space cull planes out. So we hook it and overwrite the matrix *before* the original runs.

That placement is the best thing about this mod. The cull planes get computed from the matrix we just wrote, so the frustum culls from the third-person position instead of the eye, automatically. Move the camera any later and the two disagree: the frustum still fans out from the eye while you're rendering from further back, so anything sitting in the gap gets culled even though it's plainly on screen.

![Offsetting after the cull planes leaves the frustum at the eye, so nearby props get culled while still visible. Offsetting before it gives one apex.](/uploads/images/blog/tpv-camera-frustum-cull.svg)

That's the old mod's culling problem, and here it can't happen. The near clip plane comes along too, so once the camera is seated just off a wall, the wall falls behind the near plane for free.

One catch. The same builder runs for shadow, reflection and portal cameras, and those aren't embedded in a `CView`. So the detour walks back `0xE8` bytes and checks the object sitting there carries the `CView` vtable, identified once by RTTI name then cached, so the per-frame test is a single pointer compare.

Everything the mod does happens in the few lines before that original call:

```cpp title="camera_hook.cpp - building the pose and writing it into the matrix (simplified)" showLineNumbers
// A stable pivot. The body origin does not bob; the first-person eye does.
const Vector3 pivot = body_origin + world_up * eye_height;

// A stable basis, from the player's aim quaternion, low-passed with SLERP.
// CryEngine column convention: right = q * +X, forward = q * +Y, up = q * +Z.
const Vector3 forward = basis.rotate({0.0f, 1.0f, 0.0f});
const Vector3 right   = basis.rotate({1.0f, 0.0f, 0.0f});

// Spring arm: the collision ladder shortens the boom, the ease smooths the result.
const float distance = ease(collision_clamp(pivot, forward, follow_distance));

const Vector3 camera_position = pivot - forward * distance + right * offset_right;

// The render CCamera is a row-major 3x4, so the translation is the last element
// of each row. Writing it HERE is the whole trick: the original then builds the
// cull planes from this matrix, so culling follows the third-person view.
matrix->m[0][3] = camera_position.x;
matrix->m[1][3] = camera_position.y;
matrix->m[2][3] = camera_position.z;
```

Those last three stores are the whole hook. A `Matrix34f` is CryEngine's 3x4: three rows of four floats, stored row by row, which is why the three writes land `0x10` apart. The part that catches people out is that storage order and axis convention are different questions. The bytes are row-major, but the basis vectors read *down the columns*.

![Matrix34f: row-major storage, but the Right, Forward and Up axes read down the columns, with the translation in column 3](/uploads/images/blog/tpv-camera-matrix34f.svg)

I know it catches people out because it caught me. The old mod's matrix helper built the basis in the rows, which is the transpose, which for a rotation is the inverse. The only reason Henry never ended up facing backwards is that nothing had wired that helper up yet by the time I spotted it.

That's the entire camera, in six lines of math and three stores. Everything else in this post is one of those lines refusing to be simple. (Every offset I quote here came off the build I happened to be working against; they shift when the game updates, which is its own separate headache.)

The whole thing also sits inside an `__try` block, as does every other engine call in the mod. That's the difference between a mod that quietly stops working after a game patch and one that takes your save with it.

<pre class="mermaid flex justify-center">
graph TD
    subgraph "Where the offset lands"
        A["Active camera Update()<br/>(first person, dialogue, horse...)"] --> B["CView::Update<br/>builds render CCamera 3x4 at CView+0xE8"];
        B --> C["HOOK: detour_frustum_build"];
        C --> D{"Is this the game view?<br/>(CView vtable at camera - 0xE8)"};
        D -- No --> F;
        D -- Yes --> E["Build the third-person pose<br/>and overwrite the matrix"];
        E --> F["Original CCamera::UpdateFrustumPlanes<br/>builds cull planes FROM that matrix"];
        F --> G["Renderer draws, culling matches the view"];
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    class A,B,C,D,E,F,G default;
</pre>

## Building the rig, and two kinds of shake

Related: <a href="/blog/posts/cryengine-eye-of-the-engine-the-camera" target="_blank" rel="noopener noreferrer">[CryEngine] Eye of the Engine: The Camera</a>

The rig looks trivial on paper. Pick a pivot near the player, pick a direction, put the camera at `pivot - forward * distance`. Ten lines. Except both inputs turned out to be quietly poisoned.

**The pivot.** My first version anchored to the first-person eye at `CView+0x14`. The camera shook constantly. The reason? `CView::Update` fills that field through the player's own `UpdateView`, which bakes in head bob, breathing and weapon sway. Which is correct! The eye is *supposed* to bob. My rig just inherited all of it.

The fix is to anchor to something that doesn't. The player entity keeps its world matrix at `entity+0x58`, translation column at `+0x64`, `+0x74` and `+0x84`. That's the body origin, and it sits still. So the pivot became `body_origin + world_up * EyeHeight`.

**The direction.** That killed the vertical shake and left a worse one. The eye orientation quaternion at `CView+0x20` carries view shake too: sway rotation, combat and landing shake, and the lean of scripted animations like opening a door. With the camera three or four metres behind the pivot, a tiny wobble there becomes a big swing in position. Measured live during a door animation, standing perfectly still: eye direction and real aim direction 19 degrees apart, eye itself moved 0.86 m. At rest they're identical.

So the rig stopped reading the eye. It reads the player's look controller at `*(C_Player + 0x238) + 0x24`, the clean aim quaternion, which matches the eye at rest and carries none of the shake. We sanity-check it for finite, near-unit length, fall back to the eye quaternion if it looks wrong, and low-pass it with [SLERP](https://en.wikipedia.org/wiki/Spherical_linear_interpolation).

SLERP is blending for rotations. You can't average two quaternions like two numbers and get a sensible result, so you walk the short way around the sphere between them and stop part way. A little toward the target every frame gives you a smoothing filter for orientation. (The longer version of why quaternions rather than angles is in the <a href="/blog/posts/devlog-kingdom-come-deliverance-ii-customizing-the-view-tpv-offsets-input-and-whats-under-the-hood" target="_blank" rel="noopener noreferrer">offsets devlog</a>.)

What still isn't solved: during a climb the two sources swap roles, the look controller whipping around while the eye stays smooth, the exact mirror of the door case. Inside a single frame they look identical. I tried about eleven ways to separate them, and every one either failed or traded a small problem for a bigger one. Follow the look controller and you get a small shift on climbs; follow the eye and you get shake everywhere. I picked the climb shift on purpose.

**One thing about the body.** The first-person rig hides Henry's head so it doesn't fill the screen, which from behind leaves you looking at a headless man. A second hook forces the head back on while the offset is active and passes the game's own value through when it isn't.

## The crosshair, and why it can't be perfect

This is the problem that killed the old mod, so it's the one I cared most about.

An over-the-shoulder camera doesn't look where the player aims. The camera sits right of the eye, so screen centre and the aim ray point at two different things. The standard trick is toe-in: rotate the camera slightly inward so its forward axis crosses the aim line at a chosen depth. That's exact at exactly one depth. Everywhere else the error is plain geometry:

```text title="Crosshair error at any depth"
error = atan( |OffsetRight| / (focus_distance + follow_distance) )
```

<br />

![The shoulder offset and the combined focus plus follow distance form a right triangle; the angle between the camera axis and the aim ray is the error](/uploads/images/blog/tpv-camera-crosshair-parallax.svg)

It's a right triangle: the shoulder offset is the short leg, the focus and follow distances together are the long one, and the angle between them is your error. With a 1 m shoulder offset and a 5 m focus and follow, that's 5.7 degrees, which nobody notices. Same offset at 0.5 m is 45 degrees: crosshair points left, arrow lands right. Real parallax, not a smoothing artifact, and no filtering will fix it.

So `AimFocusDistance` lets you pin the convergence depth to whatever range you play at, and a hard clamp keeps toe-in under 8 degrees so the close case can't go silly. Pixel-perfect aim needs the shoulder offset at zero, which is what every real over-the-shoulder game does the moment you press aim.

Interaction needed its own fix. The interactor casts a look ray every tick to decide what "press to use" points at, built from the gameplay view subsystem, which we never touch. So a third hook intercepts the ray-query builder and rewrites origin and direction to the render camera and screen-centre forward, but only when the return address is inside the interactor's own look-ray builder, so camera, AI and audio queries never get touched. The player is already on the skip list, so a ray starting behind Henry doesn't hit Henry.

Still only partly done: beds, doors and shrines go through a different path with its own on-screen check, which needed a fourth hook, and a few interaction types still show parallax.

## Four ways to stay out of a wall

A third-person camera in a medieval town spends most of its life trying to be inside a wall. The industry answer is a spring arm: probe from the pivot out to the camera and shorten the arm when something's in the way. Unreal ships it as [`USpringArmComponent`](https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Runtime/Engine/USpringArmComponent), Unity as the [Cinemachine Deoccluder](https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/CinemachineDeoccluder.html), and CryEngine does it with `RayWorldIntersection` and `PrimitiveWorldIntersection`. TPVCamera does the same. It just took four layers before it stopped feeling awful.

**Layer one, a fan instead of a single ray.** A raycast is a zero-thickness line: is anything sitting on this line, and how far. A single one flickers, catching an edge one frame and missing it the next, until the camera pumps in and out and you feel seasick. So the probe is a centre ray plus four more spread by the collision radius, nearest answer wins. Camera programmers call these *whiskers*. Object types are `0x101`, `ent_static | ent_terrain`, so the player and NPCs never block the view.

**Layer two, a swept sphere for smoothness.** A swept sphere, or shapecast, is a raycast with thickness: roll a ball of a given radius along the path and ask where it first touches. (Unity's [`Physics.SphereCast`](https://docs.unity3d.com/ScriptReference/Physics.SphereCast.html) is the shortest good description of the idea.) The contact distance moves *smoothly* as the ball grazes an edge, where the fan can only jump between whatever its five lines hit.

CryEngine gives us this through `PrimitiveWorldIntersection`, but I couldn't fully trust it. A raycast takes its "what am I allowed to hit" mask as a plain function argument. The sphere takes a parameter block, and I couldn't prove which field in it the engine reads as that mask. Guess wrong and the sweep stops filtering, which at point-blank range means catching the player's own skeleton and worn gear.

So I used both. The sphere is trusted only when its contact isn't closer than the fan says the world is. It can make the result smoother; it can't make it closer.

The postscript is that I eventually pinned the block down and had the fields backwards: the one I'd labelled flags is the one the engine reads as the mask, and the field I was carefully writing to is dead. The filtering had worked all along, just not for the reason I believed. The cross-check was still right, though. It cost nothing, and it meant being wrong about the engine couldn't become a bug in the camera.

**Layer three, does this thing actually hide you?** The optional see-through mode, and my favourite part. A fence rail or a market pole triggers a hit and yanks the camera in, even though you can see Henry perfectly well right past it. So instead of stopping at the first hit, the probe *walks* the arm, asking at each hit how much of the character that object hides by rasterising its render mesh against the character's silhouette. Low answer, skip it and carry on. It stops at the first thing that genuinely covers the body: terrain, a mesh over the threshold, or a solid it can't measure at all, like a building's compound mesh.

Verdicts are cached per object, deliberately asymmetric. "Collide" gets reused freely, because a wall stays a wall as the camera slides along it and colliding is the safe direction to be wrong in. "Skip" is only reused near the hit that produced it, so a thin prop's low coverage can't leak across a shared collider and let the camera clip through a bare wall.

**Layer four, what physics can't see at all.** Some KCD2 roofs, the tents and awnings and market-stall canopies, are render meshes with no ray-collidable physics behind them. Every physics probe sails through, and a look-down buries you in cloth. The renderer can see them though, so this layer asks the renderer: `I3DEngine::GetObjectsInBox` returns the render nodes along the arm, and each visible brush gets its vertices marched against the sightline. A brush only counts when enough of them land inside the sightline tube, so a rope or a beam doesn't jolt the camera while a canopy still clamps it.

Then easing. Pull-in is near instant, because the camera must never sit inside a wall for even one frame, and the return is slow and configurable so it doesn't pop the moment the obstruction clears.

One performance note, since this adds up. Collision only queries static geometry and terrain, and static geometry doesn't move, so the whole ladder recomputes only once the pivot or the desired camera position has moved 6 cm. In between, only the easing runs. Standing still costs nothing, walking skips most frames.

<pre class="mermaid flex justify-center">
graph TD
    subgraph "Collision ladder, pivot to desired camera"
        S{"Moved more than 6 cm?"} -- No --> Z["Reuse last distance,<br/>ease only"];
        S -- Yes --> A["RWI ray fan<br/>(centre + 4 offset)<br/>objtypes 0x101,<br/>world solids only"];
        A --> B{"See-through mode on?"};
        B -- No --> D;
        B -- Yes --> C["Walk the arm: measure<br/>how much of the body<br/>each hit hides.<br/>Skip thin props,<br/>stop at real cover."];
        C --> D["Cross-check the swept<br/>sphere (PWI).<br/>Trust it only if not<br/>closer than the fan."];
        D --> E["Render octree clamp<br/>(GetObjectsInBox)<br/>for cloth roofs<br/>physics cannot see"];
        E --> F["Ease: fast pull in, slow return out"];
        Z --> F;
        F --> G["camera = pivot + direction * distance"];
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    class S,Z,A,B,C,D,E,F,G default;
</pre>

### And I'm still not happy with it

This is the part I like least, so let me be straight.

What ships keeps you out of walls, which is most of the job. But walk past a thin pole, a fence line or a doorway edge and you feel the camera twitch. The probe still makes a yes-or-no decision every frame, and when that answer flips between frames the camera jiggles with it. No soft edges anywhere. The [swept sphere](https://docs.unity3d.com/ScriptReference/Physics.SphereCast.html) and the [multi-ray fan](https://www.gamedevpensieve.com/design/design_perspective/design_perspective_third-person) are the best smoothing I've got, and they're smoothing a decision that was binary to begin with.

Proper third-person cameras do better. They collide against the real shape of the mesh, they measure how much of the character is actually covered, and when moving the camera would feel worse than the obstruction, they fade the obstruction instead.

I built that last one, and it's worth saying why it isn't shipping. Fading works here: set opacity on a render node and a tent canopy or a wall dissolves out of the way, and grass fades beautifully. But I wanted it for trees, and KCD2's leaf shader ignores the dissolve flag entirely. The one occluder that most deserved fading was the one that wouldn't, so the whole feature went in the bin. I kept an unrelated raycast fix for fabric roofs that fell out of the same investigation.

So there's a rewrite on a branch, and the idea is to stop stacking layers that can disagree. Instead of a fan, a sphere and a coverage walk all voting and then taking the smallest answer, one swept capsule sized to the near plane gives a single continuous distance. A volume can't squeeze through a gap narrower than itself, so it catches the window frames and timber-frame walls thin rays slip through, and a continuous output leaves no verdict to flip. Very much an experiment, not in a release, but that's the direction.

## Knowing what the game is doing

A camera that frames a swordfight like a walk through the woods is a bad camera, so the mod reads the game state every frame and picks a preset to match.

The trick is reading signals that are exact rather than smoothed, and each one lives somewhere different:

*   **Combat and dialogue** come from the RTTI class name of whichever camera the manager has active.
*   **Stance** comes from the actor model's stance enum: crouching, lying, sitting, kneeling, horseback and cart, all out of one field.
*   **Aiming** comes from the missile weapon's aim flag, because you can draw a bow without the camera changing at all.
*   **Minigames** come from the minigame manager, for the same reason. Lockpicking never swaps the camera.
*   **Menus and overlays** come from the UI hooks I already had.

And "some UI is up" has a lovely universal signal: the hardware mouse keeps a reference count, and anything that wants a cursor raises it. That one number covers menus, looting, trading and dialogue, and it's what freezes free-look so your camera doesn't slowly spin while you sort your inventory.

All of it becomes a bit mask, debounced by a hold time so a flicker between states doesn't thrash the framing. Presets bind to combinations of those bits and the most specific match wins, so aiming while crouched can have framing of its own.

![The preset manager, with every framing value editable while the game runs](/uploads/images/blog/tpv-camera-preset-overlay.webp)

The preset editor is an ImGui overlay that makes one deliberate and slightly odd choice: it doesn't hook the game's swap chain. It runs a private D3D11 WARP device, renders offscreen, and composites onto a layered window with a GDI blit. That costs frame rate while the panel is open. In exchange it can't crash the game's render thread, and it doesn't fight ReShade, OptiScaler or any other injector. The game runs DX12 here, so a swap-chain hook buys you a compatibility headache for a panel you open for thirty seconds to nudge a number.

## What's still not right

I'd rather list these than pretend they don't exist.

*   **Free-look orbit is a proof of concept.** Fine for swinging around to look at Henry's face, rough for actual play. Interaction during orbit doesn't work, and it fights the game's own camera on horseback and in combat, so it switches itself off there.
*   **Shadows are cut off behind the character.** The view camera snapshot happens after my hook, so the shadow system already gets the third-person matrix, which puts the cutoff further downstream in the cascade camera source. Fixing it needs a live data breakpoint and a proper trace, not a guess, and I've made enough guesses about this engine for one year.
*   **The crosshair fix is partial**, as above.
*   **The first-person body rig looks slightly off from behind in some animations.** It was never built to be seen from there.
*   **Collision has no soft edges**, as above. The rewrite is where that gets fixed, if it gets fixed.

## And then Warhorse showed up

Something happened while I was writing all this that I genuinely didn't see coming. **Warhorse themselves turned up on the mod page and left a comment** 🤯

![Well, that made the whole year worth it!](/uploads/images/blog/tpv-camera-warhorse-comment.png)

Getting a nod from the people who built the engine you've spent a year poking holes in is a strange and very good feeling 🥹

---

The lesson I keep taking away from this one is about direction. The old mod asked the engine to do something it was perfectly capable of doing, then spent a month arguing with the consequences. The new mod asks the engine for nothing at all. It lets everything run exactly as it always does and changes one matrix on the way to the renderer. Everything else here, the collision ladder, the stable basis, the presets, the state detection, is ordinary work. It only became possible once the foundation stopped fighting the game.

The mod is on [NexusMods](https://www.nexusmods.com/kingdomcomedeliverance2/mods/3263) if you want to try it, and all my Kingdom Come: Deliverance II mods and tools live in this [GitHub repository](https://github.com/tkhquang/KCD2Tools). The hooking, scanning, input and config plumbing underneath all of it comes from [DetourModKit](https://github.com/tkhquang/DetourModKit), which has grown into its own thing and deserves a post of its own. Feel free to contribute or suggest improvements!

KCD2 Modding: Because the fastest way to win an argument with an engine is to stop having one. CryEngine, ***CryMore***!
