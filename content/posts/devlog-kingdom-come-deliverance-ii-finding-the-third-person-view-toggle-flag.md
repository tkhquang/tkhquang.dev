---
title: "[Devlog] Kingdom Come: Deliverance II - Finding the Third-Person View Toggle Flag"
created_at: 2025-03-29T00:00:00.000Z
updated_at: 2025-05-25T00:00:00.000Z
published: true
category_slug: gaming
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
cover_image: /uploads/images/audentis-fortuna-iuvat.png
description: "A deep dive into Kingdom Come: Deliverance II's memory to enable its built-in (likely debug) third-person view, navigating vftables and pointer chains."
---

Alright folks, it's time for another dive under the hood, this time with **Kingdom Come: Deliverance II** (KCD2). This post has now been **updated to reflect the memory addresses and details for game version 1.3.1**. My initial explorations were with an earlier build, but with the latest patch out, it was time to re-verify. My immediate impressions of KCD2 remain the same: the sheer scale and detail Warhorse has achieved is remarkable. Naturally, the engine itself beckoned further investigation with these new addresses. KCD2 is, through and through, a deeply immersive first-person RPG. However, a third-person perspective (TPV) offers distinct advantages: a better view of character equipment, broader environmental awareness, a different tactical feel, and for some players, a more comfortable viewing experience less prone to motion sickness.

My experience with KCD1 and general CryEngine knowledge suggested that a TPV system might already be lurking within the game's code, perhaps used by the developers for debugging, crafting cutscenes, or just as an unexposed feature. This devlog is the chronicle of my reverse engineering adventure into `WHGame.DLL` for the current version to locate and activate this TPV functionality. It turns out, while a TPV system is indeed present, it definitely feels like it was primarily a development or debug tool – functional, but with its own charming set of quirks!

For those eager to try it out, you can find the TPV Toggle mod based on these findings on NexusMods:
[Third Person View (TPV Camera) Enabler](https://www.nexusmods.com/kingdomcomedeliverance2/mods/1550)

## The Starting Point: `ISystem` and the Path to Camera Data

In large game engines like CryEngine (and its KCD2 fork), a common entry point to various global systems is through an interface like `ISystem`. From my prior reverse engineering work and observations of community tools (e.g., Cheat Engine tables and the KCD2ModLoader often point to `g_ISystem`, which for this version can be found at `WHGame.DLL+3E281F8`, corresponding to the `CSystem::vftable` located at `183e281f8`), it's clear that the path to the camera often involves a chain of pointers originating from, or accessible via, `ISystem` or a "Global Context" object.

The `CSystem::vftable` (at `183e281f8`) is a goldmine. Specifically, the 134th entry (index 133) is a function that yields a pointer to a camera data block. This address is `183e281f8 + 133*8 = 183e281f8 + 0x428 = 183e28620`. The function at this vftable entry (`FUN_180792250` in my disassembly) simply performs `lea rax,[rcx+00000288]`. Here, `rcx` is the `this` pointer (the `ISystem` instance), so it's returning a pointer to a member at `ISystem + 0x288`. This member is our `systemCameraMatrixPtr` – likely the final storage for the view matrix data.

```log title="Log confirming the address"
[2025-05-16 15:34:43] [INFO   ] :: GameInterface: systemCameraMatrixPtr at 0x2229856C208
```

The code that writes to this `systemCameraMatrixPtr` (`FUN_18085cd20`) appears to be a large `memcpy`-style operation, copying a complete camera state into our target memory block.

While having the final matrix is useful, to *toggle views*, we need to intervene earlier. We need to find the flag or object that dictates *which camera controller* (First-Person, Third-Person, Dialog, etc.) is active and populates this final matrix structure. This objective led me back to hunting for the `wh::game::C_CameraManager`.

## The AOB Hunt for the Camera Manager's Gateway

Finding the `wh::game::C_CameraManager` (and from there, the TPV object and its control flag) typically starts with locating a reliable pointer to the game's "Global Context" – a central data structure.

For KCD2, the function `FUN_180a0a080` in `WHGame.DLL` returns a pointer that appears to be the base of this global context. The key instruction loading this is:

```assembly title="Key instructions"
WHGame.DLL+A0A0A9 - 48 8B 05 0083AA04     - mov rax,[WHGame.DLL+54B23B0]
; This MOV loads the address stored at WHGame.DLL+54B23B0 into RAX.
; This address, WHGame.DLL+54B23B0, is where the actual Global Context instance pointer is kept.
```

To find this instruction robustly across minor patches, an AOB (Array of Bytes) signature is essential. Based on the instruction and its neighbors:

```cpp title="AOB to find the global context pointer storage address"
// AOB for locating the instruction that loads the global context pointer storage address
constexpr const char *GLOBAL_CONTEXT_PTR_STORAGE_LOAD_AOB = "7F ?? 48 8B 05 ?? ?? ?? ?? 48 83 C4 20 5B C3";
```

My `initializeGameInterface` function in the mod uses this AOB:
1.  Scans `WHGame.DLL` for this byte pattern.
2.  The `mov rax,[rip+offset]` part (AOB bytes `48 8B 05 ?? ?? ?? ??`) starts 2 bytes into my pattern.
3.  It reads the 4-byte relative offset from within the instruction (3 bytes from the start of `48 8B 05`).
4.  It calculates the `RIP` (address of the instruction *after* the `mov`).
5.  `g_global_context_ptr_address = RIP + relative_offset;`. This points to `WHGame.DLL+54B23B0`, which is the address that *stores the pointer* to the actual global context instance.

## Pointer Chasing: Global Context -> CameraManager -> TPV Object -> Flag

With `g_global_context_ptr_address` (pointing to `WHGame.DLL+54B23B0`) identified, the crucial pointer chase to our TPV flag begins. This involves a series of dereferences and offset additions:

1.  **Dereference to get the Global Context Instance:**
    First, we read the value at `g_global_context_ptr_address` to get the actual memory address of the global context object instance.
    ```cpp
    global_ctx_instance_ptr = *reinterpret_cast<uintptr_t*>(g_global_context_ptr_address);
    ```
    This `global_ctx_instance_ptr` (e.g., `0x26A07867760` based on earlier traces) is our starting point for navigating the object structure.

2.  **From Global Context to Camera Manager Instance:**
    An offset of `0x38` (`OFFSET_ManagerPtrStorage`) from the `global_ctx_instance_ptr` leads to where the pointer to the `wh::game::C_CameraManager` instance is stored. We dereference that to get the manager's instance address.
    ```cpp
    cam_manager_instance_ptr = *(uintptr_t*)(global_ctx_instance_ptr + OFFSET_ManagerPtrStorage);
    ```
    This `cam_manager_instance_ptr` (e.g., `0x26C24C1EA20`) points to the `C_CameraManager` object. We can confirm this by inspecting its virtual function table (vftable): `*cam_manager_instance_ptr` should resolve to `wh::game::C_CameraManager::vftable` (located at `18406adb8` in version 1.3.1).

3.  **From Camera Manager to Third-Person View (TPV) Object Instance:**
    Next, an offset of `0x28` (`OFFSET_TpvObjPtrStorage`) from the `cam_manager_instance_ptr` gives us the location of the pointer to the `wh::game::C_CameraThirdPerson` instance.
    ```cpp
    tpv_object_instance_ptr = *(uintptr_t*)(cam_manager_instance_ptr + OFFSET_TpvObjPtrStorage);
    ```
    This `tpv_object_instance_ptr` is the address of the specific TPV camera controller object. Its vftable should match `wh::game::C_CameraThirdPerson::vftable` (at `183a85220`). The `C_CameraManager` constructor (`FUN_180c989b8`) further confirms that the manager initializes and holds references or embedded instances of various camera types, including the TPV one.

4.  **Locating the TPV Flag within the TPV Object:**
    Finally, an offset of `0x38` (`OFFSET_TpvFlag`) *within* the `C_CameraThirdPerson` object instance points to the 1-byte flag that controls whether TPV is active.
    ```cpp
    flag_address = tpv_object_instance_ptr + OFFSET_TpvFlag;
    ```
    This `flag_address` is our ultimate target for the toggle.

The vftables from the disassembly are indispensable for this process. Key vftables include:
*   `wh::game::C_CameraManager::vftable`: at `18406adb8`. (Its constructor `FUN_180c989b8` sets up different camera objects).
*   `wh::game::C_Camera::vftable`: at `18406ab78` (The base class for all cameras).
*   `wh::game::C_CameraFirstPerson::vftable`: at `183a85098` (Identified by its vftable index 6, `FUN_181a57310`, which returns the string "FIRST PERSON").
*   `wh::game::C_CameraThirdPerson::vftable`: at `183a85220` (Identified by its vftable index 6, `FUN_181a574d0`, returning "THIRD PERSON").
*   Others like `wh::game::C_CameraDialog::vftable` (`183a85140`), `wh::game::C_CameraRider::vftable` (`183a85290`), and `wh::game::C_CameraUI::vftable` (`183a851b0`) further paint the picture of a polymorphic camera system where our TPV flag likely instructs the `C_CameraManager` which controller's logic to employ.

<pre class="mermaid flex justify-center">
graph TD
    subgraph "TPV Flag Discovery Path"
        A["Input: Mod Hotkey ('Toggle View')"] --> B{Mod Logic};
        B --> C["Call getResolvedTpvFlagAddress()"];
        C --> D["Find Global Context Storage Addr<br/>(AOB Scan for MOV near WHGame.DLL+A0A0A9)"];
        D --> D1["Global Context Storage Address<br/>(e.g., WHGame.DLL+54B23B0)"];
        D1 --> E["Dereference to get: Global Context Instance Ptr<br/>(e.g., 0x26A07867760)"];
        E --> |Add Offset_ManagerPtrStorage 0x38| F1["Addr of wh::game::C_CameraManager Instance Ptr Storage"];
        F1 --> F["Dereference to get: wh::game::C_CameraManager Instance Ptr<br/>(e.g., 0x26C24C1EA20)"];
        F --> |Verify vftable| F_VTABLE([fa:fa-table wh::game::C_CameraManager::vftable @18406adb8]);
        F --> |Add Offset_TpvObjPtrStorage 0x28| G1["Addr of wh::game::C_CameraThirdPerson Instance Ptr Storage"];
        G1 --> G["Dereference to get: wh::game::C_CameraThirdPerson Instance Ptr"];
        G --> |Verify vftable| G_VTABLE([fa:fa-table wh::game::C_CameraThirdPerson::vftable @183a85220]);
        G --> |Add Offset_TpvFlag 0x38| H["Address of TPV Flag Byte (within TPV Object)"];
        H --> I["Mod Reads/Writes Flag Value (0 <-> 1)"];
        I --> J["Game Calls Active Camera Controller's Update (e.g., FUN_1839ad780 for TPV)"];
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    class A,B,C,D,D1,E,F1,F,F_VTABLE,G1,G,G_VTABLE,H,I,J default;
</pre>

## Implementing the Toggle

With the `volatile BYTE* tpvFlagAddress` reliably resolved, the actual toggle becomes simple:

```cpp title="Implementing the Toggle" showLineNumbers
void toggleThirdPersonView() {
    Logger &logger = Logger::getInstance();

    volatile BYTE* flagAddr = getResolvedTpvFlagAddress(); // Uses the chain described
    if (flagAddr) {
        // 0 for First-Person, 1 for Third-Person
        *flagAddr = (*flagAddr == 0) ? 1 : 0;
        logger.log(LOG_INFO, "TPV Flag toggled to: " + std::to_string(*flagAddr));
    } else {
        logger.log(LOG_WARNING, "TPV Flag Address not resolved, cannot toggle.");
    }
}
```

The game's camera system, likely coordinated by `C_CameraManager` or a higher-level update function, reads this flag. It then delegates rendering tasks to the appropriate active camera controller (e.g., `wh::game::C_CameraFirstPerson` or `wh::game::C_CameraThirdPerson`). Their respective "update" methods (like `FUN_180b96198` for FPV or `FUN_1839ad780` for TPV, which perform complex quaternion math) then compute the view parameters for that frame.

## Limitations of the Built-in TPV Camera

It's crucial to remember that KCD2 is primarily a first-person experience. This built-in TPV, while functional via this flag, exhibits characteristics of a debug or developer tool rather than a fully polished player-facing feature:

*   **Clipping Issues:** The TPV camera often lacks proper collision detection, meaning it can clip through walls, objects, and terrain.
*   **UI/Event Glitches:** Some game events, menus (like the main map or dialog screens), or interactions might behave unexpectedly or have minor visual bugs when in TPV. The game often expects an FPV context for these UI elements.
*   **Unexpected Camera Shifts:** The camera distance or angle in TPV might shift erratically in certain game situations (e.g., tight corridors, specific animations). This behavior seems inherent to this unpolished TPV mode.
*   **Horse Riding Tilt:** When riding a horse, the TPV camera can sometimes appear slightly tilted or off-center.
*   **Aiming/Interactions:** Precise aiming (especially with bows) and context-sensitive interactions are finely tuned for FPV and will likely feel awkward or misaligned in TPV.
*   **No Y-Axis Mouse Look on Model:** Character head tracking based on Y-axis mouse input (looking up/down) is typically not implemented for the third-person player model; the camera moves, but Henry's head might not follow vertically in a natural way.

Despite these limitations, having the TPV option is fantastic for screenshots, general exploration, or just a different way to enjoy Bohemia!

![Finally, KCD2 in Third-Person View!](/uploads/images/KCD2-TPV.webp)

## Future Aspirations: A Custom TPV?

While toggling this built-in TPV flag is a great achievement, a more robust, player-friendly solution would likely involve crafting a completely custom third-person camera system from scratch within the mod. This is a much larger endeavor and would involve:
*   Properly handling Henry's player pose and ensuring animations look correct from all TPV angles.
*   Implementing smooth camera controls with configurable distances, offsets, and potentially shoulder-switching.
*   Adding robust camera collision detection and obstacle avoidance logic.
*   Modifying or creating new aiming reticles and ensuring interaction prompts work intuitively from TPV.
*   Extensive use of raycasting for ideal camera positioning, targeting, and line-of-sight checks.

This would essentially mean creating a new camera controller. It might involve intercepting the FPV camera's final matrix data and then calculating custom offsets and rotations based on player input and world geometry, or perhaps even attempting to inject a new custom camera controller into the game's existing polymorphic camera management system if a suitable hook point can be found. For now, unlocking the game's own (though quirky) TPV offers a very welcome alternative perspective.

This whole process, from identifying target functions via disassembly, crafting AOBs, meticulously tracing pointers through multiple object instances, and confirming object types using vftables, is pretty standard fare for this kind of in-depth game modding. Each game update from Warhorse might necessitate re-validating these AOBs and memory offsets, but the underlying architecture (like how `ISystem` connects to `C_CameraManager` which then holds different camera types) often remains a stable pattern derived from CryEngine.

---

The satisfaction of finally flipping that view after hours immersed in hex and assembly listings is what keeps this hobby so engaging. Now, if you'll excuse me, Bohemia looks quite different from a few feet back!

For those interested in the code, you can check out the tools used for this and other KCD2 experiments on GitHub:
[KCD2Tools](https://github.com/tkhquang/KCD2Tools)

KCD2 Modding: Because Henry deserves to see his own magnificent armor. CryEngine, ***CryMore***!
