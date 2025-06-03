---
title: "[Devlog] Kingdom Come: Deliverance II - Customizing the View: TPV Offsets, Input, and What's Under the Hood"
created_at: 2025-05-7T00:00:00.000Z
updated_at: ""
published: true
category_slug: technical
tags:
  - CryEngine
  - Game Development
  - "Kingdom Come: Deliverance II"
  - KCD2
  - Modding
  - Devlog
  - Reverse Engineering
  - C++
  - Camera
cover_image: /uploads/images/tpv-toggle-offset.jpg
description: "Following up on the TPV toggle: a technical deep dive into implementing custom camera offsets in Kingdom Come: Deliverance II."
---

Alright folks, our exploration of modding **Kingdom Come: Deliverance II** (KCD2) continues. In a <a href="/blog/posts/devlog-kingdom-come-deliverance-ii-finding-the-third-person-view-toggle-flag" target="_blank" rel="noopener noreferrer">previous devlog</a>, we navigated the memory landscape of `WHGame.DLL` to unearth and activate the game's built-in third-person view (TPV). While functional, that TPV was fairly basic and, as many noted, likely a debug feature with its share of quirks.

The community feedback was clear: greater control over the TPV was desired. Common requests included adjustable camera sensitivity, vertical pitch limits, and, crucially, the ability to offset the camera for a true over-the-shoulder feel. This post delves into how I tackled these enhancements, with a particular focus on the 3D mathematics, Vectors, Quaternions, and Matrices, that underpin the custom camera offset feature.

If you're looking for the mod itself, it's available here:
*   **NexusMods:** [Third Person View (TPV Camera) Enabler](https://www.nexusmods.com/kingdomcomedeliverance2/mods/1550)
And for the code that powers these features:
*   **GitHub:** [KCD2Tools](https://github.com/tkhquang/KCD2Tools)

## Beyond the Basic Toggle: The Need for Deeper Hooks

!["...it would be amazing to have the camera slightly off-center to the right."](/uploads/images/tpv-toggle-feedback-offset.png)

Simply flipping the game's TPV flag gives us a third-person perspective, but it doesn't allow us to change *where* that camera sits relative to Henry or how it responds to mouse movements. To achieve that, we need to intercept the game's own camera update and input processing logic. This involves finding specific functions within `WHGame.DLL` using AOB (Array of Bytes) scanning and then detouring them using a hooking library like MinHook.

For this post, we'll zoom in on the camera offset feature. The core challenge is: how do we take user-defined X, Y, and Z offset values and apply them correctly to the game's existing third-person camera so it *feels* right, regardless of where Henry or the camera is looking? This is where 3D math comes into play.

## The Core of Custom Offsets: Hooking `C_CameraThirdPerson::Update()`

The game's `wh::game::C_CameraThirdPerson` object (which we identified in the previous RE effort) has an internal update function that is responsible for calculating the TPV camera's position and orientation every frame. Let's call this `TpvCameraUpdateFunc`. My goal was to let the game calculate its default TPV, then take that result and modify the camera's *position* before the game uses it for rendering.

```cpp title="tpv_camera_hook.cpp - Detour_TpvCameraUpdate (Simplified & Explained)"
// Typedef for the original function
typedef void(__fastcall *TpvCameraUpdateFunc)(uintptr_t thisPtr_TPVObject, uintptr_t outputPosePtr);
static TpvCameraUpdateFunc fpTpvCameraUpdateOriginal = nullptr; // Our trampoline to the original

// The detour that gets called instead of the game's function
void __fastcall Detour_TpvCameraUpdate(uintptr_t thisPtr_TPVObject, uintptr_t outputPosePtr) {
    // 1. Always call the original game function FIRST.
    // This is crucial. We want the game to do its normal TPV calculations
    // (like basic distance, collision avoidance if any, character tracking).
    // The result (position and rotation) is written into the structure
    // pointed to by 'outputPosePtr'.
    if (fpTpvCameraUpdateOriginal) {
        fpTpvCameraUpdateOriginal(thisPtr_TPVObject, outputPosePtr);
    } else {
        // Safety: if the hook isn't set up right, don't do anything.
        return;
    }

    // Only apply our logic if TPV is actually active (via our toggle flag)
    if (getViewState() != 1) { // getViewState() checks our mod's TPV flag
        return;
    }

    // outputPosePtr points to a game structure. Through reversing, we've
    // determined its layout. Let's assume:
    // - Position (Vector3: x,y,z) starts at outputPosePtr + Constants::TPV_OUTPUT_POSE_POSITION_OFFSET (e.g., 0x0)
    // - Rotation (Quaternion: x,y,z,w) starts at outputPosePtr + Constants::TPV_OUTPUT_POSE_ROTATION_OFFSET (e.g., 0x0C)

    // Get modifiable pointers to the game's calculated position and rotation
    Vector3* gamePositionPtr = reinterpret_cast<Vector3*>(outputPosePtr + Constants::TPV_OUTPUT_POSE_POSITION_OFFSET);
    Quaternion* gameRotationPtr = reinterpret_cast<Quaternion*>(outputPosePtr + Constants::TPV_OUTPUT_POSE_ROTATION_OFFSET);

    // Read the current camera state calculated by the game
    Vector3 gameCalculatedPosition = *gamePositionPtr;     // World-space position
    Quaternion cameraWorldRotation = *gameRotationPtr;   // World-space orientation

    // Get the desired *local* offset values (e.g., X=0.5, Y=-1.5, Z=0.1)
    // These are read from the mod's config, an active camera profile, or a current transition.
    Vector3 localOffset = GetActiveOffset(); // My helper function

    // If there's no offset to apply (all zeros), we're done.
    if (localOffset.x == 0.0f && localOffset.y == 0.0f && localOffset.z == 0.0f) {
        return;
    }

    // THIS IS THE CORE MATH: Transform the local offset into a world-space offset.
    // A 'localOffset' of (0.5, 0, 0) means "0.5 units to the camera's own right."
    // To apply this in the world, we need to rotate this local vector by the
    // camera's current world rotation.
    Vector3 worldOffset = cameraWorldRotation.Rotate(localOffset);
    // Our Quaternion struct has a Rotate method:
    // Vector3 Quaternion::Rotate(const Vector3& v) const {
    //     DirectX::XMVECTOR q = this->ToXMVector();         // Convert our Quat to XMVECTOR
    //     DirectX::XMVECTOR vec = v.ToXMVector();           // Convert input Vector3 to XMVECTOR
    //     DirectX::XMVECTOR rotatedVec = DirectX::XMVector3Rotate(vec, q); // DirectX does the math!
    //     return Vector3::FromXMVector(rotatedVec);         // Convert result back to our Vector3
    // }

    // Now, add the calculated world-space offset to the game's original TPV position.
    Vector3 finalPosition = gameCalculatedPosition + worldOffset;

    // Finally, write our modified position back into the game's output structure.
    *gamePositionPtr = finalPosition;
    // The camera's rotation/orientation (cameraWorldRotation) is left untouched by this logic;
    // we're only changing its position to achieve the offset.
}
```

This detour is established using an AOB scan for `Constants::TPV_CAMERA_UPDATE_AOB_PATTERN` to find the original `TpvCameraUpdateFunc` within `WHGame.DLL`.

<pre class="mermaid flex justify-center">
graph TD
    subgraph "Camera Position Customization Flow"
        ModControl["Mod (e.g., Profile Change Hotkey<br/>or Live Adjustment Hotkey)"] --> ProfileMgr["CameraProfileManager<br/>(Manages g_currentCameraOffset,<br/>saved profiles, transitions)"];

        GameCall["Game Calls Original<br/>C_CameraThirdPerson::Update()"] --> Hook_Pos["HOOK: Detour_TpvCameraUpdate<br/>(tpv_camera_hook.cpp)"];
        Hook_Pos --> CallOrig_Pos["Call Original TpvCameraUpdateFunc()<br/>Game calculates default TPV Pose (Pos & Rot)"];
        CallOrig_Pos --> ReadGamePose["Mod Reads Game's TPV Position & Rotation"];

        ProfileMgr --> GetLocalOffset["Mod Gets Active Local Offset<br/>(from g_currentCameraOffset)"];

        subgraph "Offset Transformation"
           ReadGamePose -- Camera World Rotation --> TransformOffset;
           GetLocalOffset -- Local XYZ Offset --> TransformOffset;
           TransformOffset["Transform Local Offset to World Offset<br/>(worldOffset = cameraRotation.Rotate(localOffset))"];
        end

        TransformOffset --> ApplyWorldOffset["Apply World Offset to Game's Position<br/>(finalPos = gamePos + worldOffset)"];
        ApplyWorldOffset --> WriteBackPose["Mod Writes Modified Position Back to Game"];
        WriteBackPose --> Renderer["Game Renderer Uses Modified Position"];
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    class ModControl,ProfileMgr,GameCall,Hook_Pos,CallOrig_Pos,ReadGamePose,GetLocalOffset,TransformOffset,ApplyWorldOffset,WriteBackPose,Renderer default;
</pre>


## Deconstructing the 3D Math: Vectors, Quaternions, and Transforms

Related: <a href="/blog/posts/devlog-kingdom-come-deliverance-ii-finding-the-third-person-view-toggle-flag" target="_blank" rel="noopener noreferrer">[CryEngine] Eye of the Engine: The Camera</a>

To truly grasp how the offset works, let's touch on the 3D math components involved:

1.  **`Vector3` (Our Simple Struct in `math_utils.h`)**:
    *   Represents a point or direction in 3D space with `x, y, z` components.
    *   We use it for:
        *   `gameCalculatedPosition`: The camera's position in world space as determined by KCD2.
        *   `localOffset`: The desired shift relative to the camera's own orientation (e.g., "0.5 units to my right, 1.5 units behind me, 0.1 units above me").
        *   `worldOffset`: The `localOffset` after being transformed into a world-space direction.
        *   `finalPosition`: The `gameCalculatedPosition + worldOffset`.
    *   It has basic vector operations like addition (`+`), subtraction (`-`), and conversion to/from `DirectX::XMVECTOR` for using DirectXMath library functions.

2.  **`Quaternion` (Our Struct in `math_utils.h`)**:
    *   Represents a rotation in 3D space with `x, y, z, w` components. Quaternions are fantastic for avoiding gimbal lock and for smooth interpolation of rotations (SLERP), which is used by the `TransitionManager` for camera profiles.
    *   `cameraWorldRotation`: This is the key. It's the orientation of the camera in world space *as calculated by the game*. We read this directly from the game's output pose structure.
    *   **`Quaternion::Rotate(const Vector3& v)` method:** This is where the magic happens for the offset.
        *   It takes a `Vector3` (our `localOffset`).
        *   Converts both the quaternion itself and the input vector to `DirectX::XMVECTOR`.
        *   Uses `DirectX::XMVector3Rotate(vectorToRotate, rotationQuaternion)`: This DirectXMath function applies the quaternion's rotation to the vector. If `localOffset` is `(0.5, 0, 0)` (local right) and `cameraWorldRotation` is facing North, `XMVector3Rotate` will return a vector pointing East in world coordinates.
        *   Converts the resulting `XMVECTOR` back to our `Vector3` struct. This is our `worldOffset`.

3.  **No Explicit Matrix Math in *This Specific* Detour, but It's Implied:**
    *   While my detour `Detour_TpvCameraUpdate` primarily uses `Vector3` and `Quaternion` logic for the offset, the underlying game structures (like the one `outputPosePtr` points to, or player/entity transforms such as `GameStructures::Matrix34f m_worldTransform;`) use 3x4 matrices (`Matrix34f`) to store full transformations (rotation and translation).
    *   A `Matrix34f` typically stores:
        *   The first 3x3 part is the rotation matrix (representing the object's X, Y, and Z axes in world space).
        *   The last column (or often, specific elements like `m[0][3], m[1][3], m[2][3]`) is the translation (position) vector.
    *   Our `cameraWorldRotation` (Quaternion) is essentially the rotational component of the camera's full view matrix. The game would use this quaternion (or convert it to a 3x3 rotation matrix) along with `gameCalculatedPosition` to build the final view matrix for the renderer.
    *   My `Quaternion::LookRotation` is an example of building a quaternion from direction vectors, similar to how a view matrix is constructed. It uses `DirectX::XMMatrixLookToRH` (creates a view matrix) then inverts it to get a world orientation matrix, and finally extracts the quaternion from that. This shows the close relationship.

![Matrix34f Structure (Conceptual - CryEngine Row-Major)](/uploads/images/Matrix34f.svg)

By letting the game compute `gameCalculatedPosition` and `cameraWorldRotation` first, we respect its core TPV logic (like its default distance from Henry or any rudimentary collision handling it might do). We then just nudge that final position by applying our `localOffset` transformed into the correct `worldOffset` using the camera's own orientation.

## Refining TPV Input: Sensitivity and Pitch Limits

**`tpv_input_hook.cpp`**

The default TPV mouse input in KCD2 felt overly sensitive, particularly vertically. Players also (rightly) didn't want to accidentally flip the camera upside down. This required hooking a different function – one that processes mouse input specifically when the TPV camera controller is active.

I found this function via AOB (`Constants::TPV_INPUT_PROCESS_AOB_PATTERN`) and detoured it with `Detour_TpvCameraInput`.
*   **Input Event Structure (`GameStructures::InputEvent`):** KCD2 passes input information in a structure that includes an `eventId` (e.g., `0x10A` for TPV Yaw, `0x10B` for TPV Pitch) and a `deltaValue`.
*   **Sensitivity:** For yaw and pitch, my detour simply multiplies the incoming `event->deltaValue` by a user-configurable sensitivity factor (`g_config.tpv_yaw_sensitivity`, `g_config.tpv_pitch_sensitivity`) from the INI file.

    ```cpp
    // Example for yaw
    event->deltaValue *= g_config.tpv_yaw_sensitivity;
    ```

*   **Pitch Clamping:** For vertical (pitch) movement, I maintain a running total of the applied pitch (`g_currentPitch` in degrees). After applying sensitivity, the new proposed pitch is clamped between `g_config.tpv_pitch_min` and `g_config.tpv_pitch_max` (also from INI). The `event->deltaValue` is then adjusted to reflect only the movement allowed within these limits.

    ```cpp
    // Simplified pitch clamping
    float currentPitchDeg = g_currentPitch.load();
    float proposedPitchDeg = currentPitchDeg + (event->deltaValue * sensitivity);
    float clampedPitchDeg = std::clamp(proposedPitchDeg, g_config.tpv_pitch_min, g_config.tpv_pitch_max);
    event->deltaValue = clampedPitchDeg - currentPitchDeg; // Only apply the actual change
    g_currentPitch.store(clampedPitchDeg);
    ```

*   **Menu Input Blocking:** Crucially, `Detour_TpvCameraInput` *returns early* without calling the original game input function if my UI hooks (`ui_menu_hooks.cpp`) detect that a full-screen game menu (inventory, map, etc.) is active. This stops the TPV camera from erratically moving around while the player is interacting with UI, a common annoyance.

<pre class="mermaid flex justify-center">
graph TD
    subgraph "TPV Mouse Input Customization Flow"
        GameMouseInput["Game's TPV Mouse Event Occurs<br/>(with original deltaValue)"] --> Hook_Input["HOOK: Detour_TpvCameraInput<br/>(tpv_input_hook.cpp)"];
        Hook_Input --> CheckMenu{"Is Game Menu Active?"};
        CheckMenu -- Yes --> ReturnEarly["Return (Block Input Processing)"];
        CheckMenu -- No --> ProcessInput["Process Mouse Event (Yaw/Pitch)"];
        ProcessInput --> ApplySensitivity["Apply Sensitivity Multiplier to deltaValue<br/>(from config: tpv_yaw_sensitivity, tpv_pitch_sensitivity)"];
        ApplySensitivity --> CheckPitchLimits{"Is Pitch Event AND Limits Enabled?"};
        CheckPitchLimits -- Yes --> ClampPitch["Calculate New Pitch<br/>Clamp Accumulated Pitch (g_currentPitch)<br/>Adjust deltaValue to Respect Limits"];
        CheckPitchLimits -- No --> CallOrig_Input;
        ClampPitch --> CallOrig_Input["Call Original TpvCameraInputFunc()<br/>(with potentially modified deltaValue)"];
        CallOrig_Input --> GameCameraLogic["Game Camera Responds to (Modified) Input"];
    end
    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    class GameMouseInput,Hook_Input,CheckMenu,ReturnEarly,ProcessInput,ApplySensitivity,CheckPitchLimits,ClampPitch,CallOrig_Input,GameCameraLogic default;
</pre>

## Other Quality-of-Life: Scroll Wheel and Overlay Management

**`event_hooks.cpp`**

To prevent the scroll wheel from zooming the TPV camera while also scrolling lists in an open UI menu, I also hook a more general game event handler (`EventHandlerDetour` via `Constants::EVENT_HANDLER_AOB_PATTERN`). If it detects a scroll wheel event (`Constants::MOUSE_WHEEL_EVENT_ID`) *and* my UI hooks indicate an overlay (like a menu) is active, it zeroes out the scroll `deltaValue` in the event structure *before* passing it to the original game function. This effectively "eats" the scroll input for camera zoom purposes when a UI overlay needs it.


<pre class="mermaid flex justify-center">
graph TD
    subgraph "UI Overlay & Scroll Wheel Management"
        direction LR
        GameEvents["Game Events"] --> EventRouter{Mod Hooks};

        subgraph "UI Overlay Logic (ui_overlay_hooks.cpp)"
            GameEvents -- "Menu Opens/Closes" --> Hook_UI["Hook UI_Overlay_Show/Hide"];
            Hook_UI --> TrackOverlayState["Update g_isOverlayActive (atomic bool)"];
            TrackOverlayState --> SwitchFPV["If Overlay Opens: Request FPV via Main Thread"];
            TrackOverlayState --> RestoreView["If Overlay Closes: Request Previous View Restoration"];
        end

        subgraph "Scroll Wheel Filtering (event_hooks.cpp)"
            GameEvents -- "Mouse Wheel Scroll" --> Hook_Event["Hook General Event Handler"];
            Hook_Event --> CheckScrollCondition{"Overlay Active OR Not Holding Scroll Key?"};
            CheckScrollCondition -- Yes --> ZeroDelta["Zero Out Scroll Event's deltaValue"];
            CheckScrollCondition -- No --> PassThruScroll;
            ZeroDelta --> OriginalEventHandler["Call Original Event Handler"];
            PassThruScroll --> OriginalEventHandler;
        end
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    class GameEvents,EventRouter,Hook_UI,TrackOverlayState,SwitchFPV,RestoreView,Hook_Event,CheckScrollCondition,ZeroDelta,PassThruScroll,OriginalEventHandler default;
</pre>

## Challenges and the Nature of This TPV

This multi-faceted approach of toggling a native flag and then layering hooks for position and input gives a good amount of control. However, the core TPV is still the game's own, likely debug, camera.
*   **Raycast/Aiming Misalignment:** The most significant limitation of simple offset TPV is that the game's aiming and interaction raycasts still originate from the *original* FPV or default TPV camera position. This means your crosshair in an offset view won't accurately represent what Henry is aiming at or can interact with. Fixing this properly is a much deeper challenge, often requiring changes to how the game itself performs these raycasts.
*   **No Custom Animation Blending:** Henry's animations are designed for FPV. In TPV, especially with custom offsets, you might see some awkwardness as the player model isn't fully adapted for being viewed from these new angles constantly.

For a "perfect" TPV, one would need to write a completely new camera controller, handle animation states differently for TPV (like in dedicated third-person games), and integrate custom aiming/interaction systems. That's a monumental task. For now, enhancing the game's existing (if hidden) TPV offers a good balance of features versus development effort.

This ongoing RE work for KCD2, identifying target functions, AOB scanning, carefully detouring, and understanding game structures through disassembly and runtime analysis, is the heart of creating these kinds of mods. It's a continuous learning process, especially as game patches can (and do!) change memory layouts and function signatures.

---

The process of chipping away at an engine's internals to enable new functionality or refine existing behavior is always a rewarding puzzle. The camera is such a fundamental part of our game experience, and being able to tailor it makes a big difference.

If you're curious about the C++ code, feel free to browse the repository:
[KCD2Tools on GitHub](https://github.com/tkhquang/KCD2Tools)

KCD2 Modding: Because even a medieval peasant deserves good camera angles. CryEngine, ***CryMore***!
