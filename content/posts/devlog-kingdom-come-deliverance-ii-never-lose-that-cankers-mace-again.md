---
title: "[Devlog] Kingdom Come: Deliverance II - Never Lose That Canker's Mace Again!"
created_at: 2025-04-13T00:00:00.000Z
updated_at: 2025-04-21T00:00:00.000Z
published: true
category_slug: technical
tags:
  - "Kingdom Come: Deliverance II"
  - KCD2
  - Modding
  - Devlog
  - Lua
  - CryEngine
cover_image: /uploads/images/loot-beacon-1.png
description: "The story behind creating the Loot Beacon mod for Kingdom Come: Deliverance II – from a frustrating search for a mace to Lua scripting and color accessibility."
---

Alright folks, time for another peek into the modding workshop. This time, our subject is the magnificent, sprawling world of **Kingdom Come: Deliverance II** (KCD2). My latest adventure wasn't chasing down memory addresses for a TPV toggle, but rather scratching a very practical itch: the eternal struggle of finding loot. And yeah, the specific catalyst was spending an entire, rather frustrating, day combing the Bohemian countryside for that damned **"Canker's Mace."** 🤣 There had to be a better way.

We've all been there after a hectic skirmish: that crucial sword or valuable shield skitters away, only to vanish into the dense foliage or the dim light of a dungeon floor.

![The classic struggle: a dropped weapon nearly invisible in the dense undergrowth.](/uploads/images/loot-beacon-2.webp)

This very frustration led to the "Loot Beacon" mod – a little Lua-scripted helper to ensure Henry (and by extension, me) never misses a valuable drop, a hidden corpse, or an important herb again. With a simple keypress, elusive items become clear.

![With Loot Beacon enabled, the same weapon is now clearly highlighted and easy to spot.](/uploads/images/loot-beacon-3.webp)

This is a different beast from deep C++ DLL hacking; KCD2, like its predecessor, offers a robust Lua scripting system, which is what this mod primarily leverages. Warhorse Studios has even provided some [official modding guidance](https://warhorse.youtrack.cloud/articles/KM-A-3/Structure-of-a-Mod), and for those diving into script binds, I've hosted the [extracted WH scriptbind documentation here](https://tkhquang.github.io/KCD2Tools/script_bind/script_bind_2025_01_14/).

For those interested in trying it out, the Loot Beacon mod can be found on NexusMods and the Steam Workshop:
*   NexusMods: [Loot Beacon](https://www.nexusmods.com/kingdomcomedeliverance2/mods/1722)
*   Steam Workshop: [Loot Beacon](https://steamcommunity.com/sharedfiles/filedetails/?id=3462589332)

### The Core Idea: Light 'Em Up!

The goal was simple: press a key, and have nearby lootable objects highlight themselves with a visual cue. In CryEngine (and its KCD2 fork), this usually means particle effects. The engine is fantastic at particles, so the plan was to:
1.  Detect nearby entities.
2.  Filter them to find interesting ones (items, corpses, specific custom entities).
3.  Attach a particle effect "beacon" to them.

![Light 'Em Up](/uploads/images/light-em-up.gif)

This sounds straightforward, but as always, the devil is in the details, especially when dealing with entity types and game states.

### Mod Structure: A Modular Approach

I decided to structure the mod into several Lua modules for clarity and maintainability, all loaded by a main `loot_beacon.lua` bootstrap script:

*   `core.lua`: Handles overall mod initialization, versioning, and acts as a central point.
*   `logger.lua`: A simple logging utility for debugging (essential!).
*   `config.lua`: Manages all configurable settings (keybinds, colors, detection radius, etc.), loadable from `mod.cfg`.
*   `entity_detector.lua`: The brains of the operation – scans for entities, filters by type, and checks for lootability.
*   `highlighter.lua`: Attaches and removes the particle effects from detected entities.
*   `command_registry.lua`: Sets up console commands for controlling the mod.
*   `event_handler.lua`: Listens to game events (like game pause/resume) to manage highlights safely.
*   `ui_manager.lua`: Provides on-screen notifications about what's been found.

The bootstrap (`loot_beacon.lua`) just ensures all these are loaded in the correct order:

```lua title="Snippet from loot_beacon.lua" showLineNumbers
function LootBeacon_LoadModules()
    local modPath = "Scripts/LootBeacon"
    local moduleFiles = { -- Order matters for dependencies
        "/core.lua", "/logger.lua", "/config.lua",
        "/entity_detector.lua", "/highlighter.lua",
        "/command_registry.lua", "/event_handler.lua", "/ui_manager.lua"
    }
    for _, file in ipairs(moduleFiles) do
        Script.LoadScript(modPath .. file) -- Error handling omitted for brevity
    end
    return true
end

if LootBeacon_LoadModules() then LootBeacon.Core:initialize() end
```

### Detecting What's Worth a Beacon

The `EntityDetector` is where much of the specific game logic comes in. It uses `System.GetEntitiesInSphere(playerPos, radius){:lua}` to get all nearby entities, then iterates through them.

```lua title="Snippet from entity_detector.lua (simplified)" showLineNumbers
function LootBeacon.EntityDetector:detectEntities()
    self:resetResults()
    local playerPos = player:GetPos()
    local radius = LootBeacon.Config.detectionRadius
    local allEntities = System.GetEntitiesInSphere(playerPos, radius)

    for _, entity in pairs(allEntities) do
        self:processEntity(entity)
    end
    return self.results
end

function LootBeacon.EntityDetector:processEntity(entity)
    if not entity or entity:IsHidden() then return end

    -- Metadata for things like if stealing is required, or if corpse is illegal to loot
    self.results.metadata[entity.id] = { requires_stealing = false, illegal_corpse = false, ... }

    if self:isCustomEntityClass(entity.class) then
        table.insert(self.results.custom, entity)
    elseif entity.actor then -- NPCs and Animals
        if entity.actor:IsDead() or (Config.treatUnconsciousAsDead and entity.actor:IsUnconscious()) then
            if entity.human then table.insert(self.results.corpses, entity)
            else table.insert(self.results.animals, entity) end
            if entity.soul and not entity.soul:IsLegalToLoot() then
                 self.results.metadata[entity.id].illegal_corpse = true
            end
        end
    elseif entity.class == self.ENTITY_CLASS_PICKABLE then
        local isPickable, requiresStealing = self:getItemPickabilityInfo(entity)
        if isPickable then
            table.insert(self.results.items, entity)
            if requiresStealing then self.results.metadata[entity.id].requires_stealing = true end
        end
    end
end
```

Getting item pickability involves checking `item:CanPickUp(player.id){:lua}` and `item:CanSteal(player.id){:lua}`. A crucial filter was skipping items with empty UI names (often NPC-only inventory items) or items currently in use. Custom entities like "Nest" or "Stash" (for chests) are handled via a configurable list.

### Making Things Glow: Particles and Accessibility

The `Highlighter` module takes the detected entities and uses `entity:LoadParticleEffect(-1, effectPath, {}){:lua}` to attach the visual beacons. These are defined in a `loot_beacon.xml` particle library.

<pre class="mermaid flex justify-center">
graph TD
    subgraph "Loot Beacon Activation Flow"
        A[Hotkey Pressed] --> B{Command Registry};
        B --> C["LootBeacon.Highlighter:activateHighlights()"];
        C --> D["LootBeacon.EntityDetector:detectEntities()"];
        D --> E["System.GetEntitiesInSphere()"];
        E --> F["Filter & Classify Entities<br/>(Items, Corpses, Animals, Custom)"];
        F --> G["Highlighter applies<br/>Particle Effects (entity:LoadParticleEffect)"];
        G --> H["Visual Beacons Appear in Game"];
        C --> I["LootBeacon.UIManager:showHighlightResults()"];
        I --> J["On-Screen Notification"];
        C --> K["Script.SetTimer for Auto-Removal"];
    end

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    class A,B,C,D,E,F,G,H,I,J,K default;
</pre>

Initially, my go-to color for items was a bright red particle effect (`loot_beacon.pillar_red`). This seemed fine until I received some valuable feedback:

!["Am colorblind red is barely noticeable"](/uploads/images/loot-beacon-feedback.png)

This was a classic oversight on my part. Color accessibility is incredibly important. The user pointed out that red is a common problem for colorblind individuals and suggested purple as a more universally visible alternative, mentioning that some developers use gold and purple together. They also shared a helpful [PDF on Colorblind Safe Color Schemes](https://www.nceas.ucsb.edu/sites/default/files/2022-06/Colorblind%20Safe%20Color%20Schemes.pdf).

Based on this feedback and the guide, I decided to expand the available particle effect colors in `loot_beacon.xml`, creating simple pillar effects for:

*   <span style="color: red; background: #111; padding: 0 2px;">red</span>,
<span style="color: green; background: #111; padding: 0 2px;">green</span>,
<span style="color: blue; background: #f4f4f4; padding: 0 2px;">blue</span>,
<span style="color: yellow; background: #111; padding: 0 2px;">yellow</span>,
<span style="color: cyan; background: #111; padding: 0 2px;">cyan</span>,
<span style="color: magenta; background: #111; padding: 0 2px;">magenta</span>,
<span style="color: orange; background: #111; padding: 0 2px;">orange</span>,
<span style="color: purple; background: #f4f4f4; padding: 0 2px;">purple</span>,
<span style="color: white; background: #111; padding: 0 2px;">white</span>,
<span style="color: lightblue; background: #111; padding: 0 2px;">lightblue</span>,
<span style="color: pink; background: #111; padding: 0 2px;">pink</span>,
<span style="color: lime; background: #111; padding: 0 2px;">lime</span>,
<span style="color: teal; background: #f4f4f4; padding: 0 2px;">teal</span>.



Then, I updated the mod's default color configuration (in `mod.cfg` and settable via console commands) to use a more accessible palette based on common advice for visibility across various color vision deficiencies. For **version 1.4.2+**, the new defaults are:
*   Pickable Items & Custom Entities: **<span style="color: orange; background: #111; padding: 0 2px;">Orange</span>** (`loot_beacon.pillar_orange`)
*   Human Corpses: **<span style="color: cyan; background: #111; padding: 0 2px;">Cyan</span>** (`loot_beacon.pillar_cyan`)
*   Animal Carcasses: **<span style="color: blue; background: #f4f4f4; padding: 0 2px;">Blue</span>** (`loot_beacon.pillar_blue`)

Users can, of course, customize these paths to any of the available "pillar_COLOR" effects or even point to different custom particle effects if they create them. The community feedback was overwhelmingly positive for these changes.

### Configuration and Commands

A good mod needs to be configurable. I exposed a range of console commands via `CommandRegistry` (using `System.AddCCommand`) to tweak settings like detection radius, highlight duration, which object types to highlight, "Good Citizen Mode" (to not highlight stolen items), and the particle effect paths for each category.

```lua title="Snippet from command_registry.lua" showLineNumbers
function LootBeacon.CommandRegistry:registerCommand(name, action, description)
    System.AddCCommand(name, action, description) -- Error handling and logging omitted
end

-- Example registration
self:registerCommand("loot_beacon_activate", "LootBeacon.Highlighter:activateHighlights()", "Activate highlights")
self:registerCommand("loot_beacon_set_item_particle_effect_path", "LootBeacon.Config:setItemParticleEffectPath(%line)", "Set item particle color")
```
These settings are persisted in `mod.cfg` (KCD2's standard for mod configuration files).

### Learning and Next Steps

This Loot Beacon mod was a fun exercise in Lua scripting within KCD2's CryEngine environment. It highlighted the importance of modular design, the power of the existing script binds for entity interaction and particle effects, and crucially, the immense value of community feedback for improving accessibility.

There are always more things to find and tweak. Perhaps refining the particle effects themselves (I'm no particle artist) or finding even more nuanced ways to filter loot could be next. But for now, no more lost Canker's Mace for me!

---

The official modding tools and the community's willingness to share knowledge are invaluable. If you're curious about KCD2 modding or want to contribute, feel free to check out the source for this and my other tools.

All my Kingdom Come: Deliverance II mods and tools can be found in this [GitHub repository](https://github.com/tkhquang/KCD2Tools).

KCD2 Modding: Making sure Henry sees ALL the shiny things. CryEngine, ***CryMore***!
