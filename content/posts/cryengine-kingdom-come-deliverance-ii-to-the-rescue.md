---
title: "[CryEngine] Kingdom Come: Deliverance II To The Rescue?"
created_at: 2025-03-20T00:00:00.000Z
updated_at: ""
published: true
category_slug: technical
tags:
  - CryEngine
  - Game Development
  - "Kingdom Come: Deliverance II"
  - KCD2
cover_image: /uploads/images/KCD2.jpg
description: "Kingdom Come: Deliverance 2's stunning showcase on a forked CryEngine offers a beacon of hope and a fascinating look into engine customization, thanks to licensed source code access."
---

Not too long ago, many of us in the CryEngine community (modders, developers, enthusiasts alike) were looking at news from Crytek: layoffs, *Crysis 4* on hold, and feeling a distinct sense of unease about the engine's trajectory. You can read my previous thoughts <a href="/blog/posts/cryengine-a-cloud-over-crytek" target="_blank" rel="noopener noreferrer">here if you missed it</a>. The question on many minds: what does this mean for the future of this powerhouse engine?

Well, folks, sometimes the best answers come not from the original source, but from those who take the core and run with it in spectacular fashion. Enter **Kingdom Come: Deliverance 2 (KCD2)**. The recent showings, technical breakdowns, and community buzz are painting a picture of a deeply impressive game. And guess what's under the hood? A heavily modified, or "forked," version of CryEngine.

This isn't just a minor footnote, it's a testament. KCD2 looks to be pushing boundaries in world detail, foliage rendering (a CryEngine specialty!), character fidelity, and overall immersion, all hallmarks of what a finely tuned CryEngine can achieve. The fact that Warhorse Studios has managed this with their *own iteration* of the engine speaks volumes.

### The "Heavily Forked" CryEngine: What Does That Actually Mean?

This is where it gets interesting for us technically-minded folks. When we say an engine is "forked," it means the studio (in this case, Warhorse) licensed a specific version of CryEngine's source code at some point and then started developing it independently *for their project*. They created their own internal branch, tailored to their specific, highly ambitious needs for a historically-grounded open-world RPG.

<pre class="mermaid flex justify-center">
graph LR
    subgraph "CryEngine Development & Licensing"
        A["CryEngine (Mainline/Original)"] -->|License Source Code under EULA| B(Warhorse Studios);
        B --> C{Create Internal Fork<br/>Example: CryEngine 3.x base};
        C --> D["Warhorse's Custom<br/>CryEngine Version"];
        D --> E["Extensive Modifications & Optimizations for KCD/KCD2"];
        E --> F[Kingdom Come: Deliverance 2];

        subgraph "Warhorse Internal Development (Enabled by Source Access)"
            direction TB
            D --- G["Deep RPG Systems Integration<br/>(AI, Quest, Dialogue)"];
            D --- H["Custom Renderer Optimizations<br/>(Foliage, Global Illumination, Streaming)"];
            D --- I["Bespoke Tooling & Pipeline<br/>(World Editor, Asset Flow)"];
            D --- J["Targeted Performance Tuning<br/>(CPU/GPU for dense worlds)"];
            D --- K["Modern Feature Implementation<br/>(DLSS/FSR, etc.)"]
        end
    end

    %% Styling
    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    class A,B,C,D,E,F,G,H,I,J,K default;
</pre>

Why fork an entire engine, especially one with its own licensing terms? Several reasons come to mind, particularly for a project as demanding as KCD:

1.  **Ultimate Control & Long-Term Stability:** By creating an internal fork from the licensed source, Warhorse insulated themselves from potentially disruptive changes or bugs in newer mainline CryEngine releases they didn't need. They could maintain a stable, known codebase perfectly suited to their extensive development cycle.
2.  **Deep Specialization for Complex RPG Needs:** Base CryEngine is powerful but general. KCD requires incredibly specific features:
    *   **Intricate AI and NPC Schedules:** The "living world" of KCD relies on sophisticated AI. Warhorse likely built or heavily modified these systems directly within their engine fork, thanks to source access.
    *   **Rich Quest and Dialogue Systems:** These narrative systems often need deep engine-level hooks for scripting, state management, and cinematic presentation, far beyond typical SDK offerings.
    *   **Historically Accurate, Dense Environment Rendering:** KCD is lauded for its detailed, authentic medieval Bohemia. This requires custom solutions for rendering vast, dense forests (a CryEngine strength they could further amplify), sprawling villages, and realistic lighting, tailored precisely to their art style and performance targets.
    *   **Efficient Streaming and World Management:** A seamless open world of KCD's scale and detail needs highly optimized data streaming and object management systems, likely customized by Warhorse.
3.  **Targeted Performance Optimization:** With the source, Warhorse could profile, strip out unused engine components, and hyper-optimize the core systems critical for their game's content. Integrating modern upscaling tech like DLSS and FSR directly into their rendering pipeline, as GameGPU notes, demonstrates this deep control.
4.  **Tailored Tooling and Art Pipeline Integration:** They could modify and extend the engine editor and tools to perfectly match their unique workflow for creating historically accurate assets and expansive levels.
5.  **Consistent Long-Term Vision for a Series:** For a franchise like KCD, having their own refined engine version, built upon the licensed CryEngine base, allows them to iterate and build upon their specific technological innovations from one game to the next, independent of Crytek's broader roadmap. KCD2 using an "improved version" of their KCD1 engine clearly illustrates this iterative power.

***"Forking"***, in this context, doesn't imply the original engine is insufficient. It highlights that for uniquely ambitious projects, starting with a powerful, source-available engine like CryEngine (via license) and then dedicating significant effort to building highly specialized, game-specific layers on top can be the most effective path to realizing a grand vision. Warhorse wasn't starting from zero, they leveraged Crytek's years of foundational R&D and then engineered solutions for their highly specific challenges.

### The Crucial Role of Licensed Source Code Access

![Warhorse Studios Licensed CRYENGINE&reg; to Develop RPG](/uploads/images/crytek_warhorse.jpg)

One of the absolute linchpins for Warhorse Studios' achievement with Kingdom Come: Deliverance and its upcoming sequel is their ability to work directly with **CryEngine's source code, which they licensed from Crytek**. It's vital to understand what this means: CryEngine is **not open-source** in the way many FOSS (Free and Open Source Software) licenses (like MIT or GPL) are defined. As of recent information (e.g., regarding versions like 5.7 LTS), access to the CryEngine source typically requires a cryengine.com account, a GitHub account, and a formal request process. Most importantly, its use is governed by a specific End User License Agreement (EULA) from Crytek.

This EULA, as detailed by community members and available on Crytek's site, is quite comprehensive. It generally means that while you get the C++ source code, there are conditions. For instance, you typically can't redistribute the engine source itself or its core tools. There are also often restrictions on the *types* of projects you can develop (e.g., military applications, gambling, certain non-entertainment simulations are commonly excluded, with a strong focus on "Games" primarily for entertainment). Furthermore, projects usually require things like Crytek-approved splash screens and advance notice to Crytek before a commercial release.

So, while not "open" in a free-for-all sense, this model of *licensed source code access* is precisely what empowered a studio like Warhorse. By entering into a specific agreement with Crytek for their game, they obtained the rights and the C++ codebase necessary to:
1.  **Create their internal fork:** They could legally take a version of the licensed CryEngine and evolve it independently to match their singular vision for KCD – a historically-grounded, open-world RPG, which clearly fits within the "entertainment Game" definitions common in such licenses.
2.  **Perform deep, foundational modifications:** With source in hand, Warhorse could rewrite, optimize, and add entire systems directly into the engine's core. This is a level of customization far beyond what a "black box" engine (where you only get compiled libraries and a limited SDK) would allow. This let them tailor rendering, AI, quest systems, and internal tooling in ways perfectly suited to their unique project requirements.
3.  **Maintain long-term stability and focused control:** Their fork became *their* engine for *their* game, insulated from changes in Crytek's mainline development that might not align with KCD's very long and specific development cycle.

Without this specific path of licensing the source code and gaining the right to modify it (within the EULA's terms), a project as ambitious and deeply customized as Kingdom Come: Deliverance would have been vastly more challenging, if not impossible, to build on CryEngine. The strength, therefore, lies not in CryEngine being "open" in an unrestricted sense, but in Crytek providing a legitimate pathway for dedicated studios with approved projects to get right under the hood and substantially re-engineer parts of the engine to create truly bespoke and technically impressive experiences like KCD2. This level of modifiability is a significant differentiator from many other engine offerings that might restrict source access entirely or offer it under different terms.

### What KCD2's Success Signals for CryEngine (and Us)

1.  **The Core Technology is Still Immensely Potent:** At its heart, CryEngine's foundational architecture (rendering, physics, core systems) is clearly capable of producing cutting-edge, visually stunning results when leveraged by a skilled, focused team with deep access. KCD2 is a massive "proof of concept."
2.  **Licensed Source is a Differentiator:** The KCD2 story underscores that providing a path to license and modify source code is a major strength for CryEngine, enabling deeply customized, high-fidelity projects.
3.  **Hope for Ambitious Projects (with Realism):** KCD2 shows what's possible with a licensed and heavily modified CryEngine. It could inspire other developers with demanding, unique visions to explore this route, provided they have the technical capability, resources, and a project that aligns with Crytek's licensing. What Warhorse achieved took immense talent, time, and strategic investment into their engine fork.
4.  **A Potential Model for Crytek's Strategy?** One might hope Crytek continues to see the value in enabling such deep customizations for licensees, perhaps even refining their support or partnership models for studios undertaking such significant engine work.
5.  **Validation for Niche Strengths:** CryEngine has always excelled at rendering detailed natural environments and foliage. KCD2 leans into these strengths beautifully, reinforcing that for certain genres, a well-handled CryEngine foundation can be exceptional.

![Audentis Fortuna Iuvat!](/uploads/images/audentis-fortuna-iuvat.png)

While the earlier news from Crytek regarding their internal restructuring and the *Crysis 4* pause still warrants a watchful eye on the *mainline* engine's development velocity, KCD2 stands as a brilliant, shining example of CryEngine's powerful DNA. It demonstrates that with the right (licensed) access, dedication, and a clear vision, incredible experiences can be forged. The success of Warhorse's meticulously crafted fork may not instantly mean a surge in games using vanilla CryEngine, but it undoubtedly revitalizes the conversation about its potential and gives us all a solid reason to be more optimistic.

It's a reminder that an engine is both a product and a foundational technology. And sometimes, the most impressive structures are those built upon a strong, accessible (via license) foundation by architects with a very specific, very grand design.

---

The journey of understanding an engine never really ends, does it? Each new game, each new piece of information, adds another layer.

CryEngine, ***CryMore***!
