---
title: '"The AI Wrote It" Is Not a License'
created_at: 2026-10-10T00:00:00.000Z
updated_at: 2026-10-12T00:00:00.000Z
published: true
category_slug: technical
tags:
  - AI
  - Open Source
  - Licensing
  - Reverse Engineering
  - Modding
cover_image: /uploads/images/blog/ai-wrote-it-cover.webp
description: "\"The AI wrote it\" is the new excuse for never having looked."
---

> "Actually, most of the work here was done by Opus..."

That's how the reply opened. I had just pointed out that two files from one of my MIT-licensed projects were sitting in someone else's repository, byte for byte identical, along with five methods lifted whole and a handful of modules that read like my other projects run through a thesaurus. No credit. No license notice. No mention of where any of it came from.

![The reply, after the credits went in. Count the semicolons.](/uploads/images/blog/ai-wrote-it-credit-reply.png)

His prompt, by his own account, was to look up reusable stuff on the internet. It found my repository. It was *reusable*.

Now read the reply again and look at the punctuation. Two semicolons, one em dash, and a closing "sorry for the inconvenience". I can't prove who wrote that apology, and em dashes are not a crime. But I've read enough model output to recognise the accent, and I'm fairly sure the same Opus that wrote the code also wrote the apology for it 🙃

The credits did go in. And honestly, I believe him. I think he really didn't know the code was mine.

That's what bothers me. **Licenses and closed source both quietly assume that somebody, somewhere along the way, knows where the code came from.** This post is about watching that assumption fall apart. It's a concern, not a fix, because I don't have one.

## I cross the line too

Let me get this out of the way first: I'm not writing from a high horse. I reverse engineer games for fun.

Kingdom Come: Deliverance II is a first-person game. I took its camera system apart, <a href="/blog/posts/devlog-kingdom-come-deliverance-ii-finding-the-third-person-view-toggle-flag" target="_blank" rel="noopener noreferrer">found the flag behind its internal debug camera</a>, and eventually <a href="/blog/posts/devlog-kingdom-come-deliverance-ii-building-a-proper-third-person-camera" target="_blank" rel="noopener noreferrer">rebuilt the whole thing as a proper third-person camera</a> by rewriting the view matrix on its way to the renderer. On paper, that is exactly the kind of thing a EULA tells you not to do.

Warhorse saw the [demo video](https://www.youtube.com/watch?v=NuCQHDoQnVE) and left this under it:

![Still one of my favourite comments on anything I've made](/uploads/images/blog/tpv-camera-warhorse-comment.png)

I'm under no illusion about why they were fine with it. The mod makes their game more accessible to people who already bought it, people for whom first person is a dealbreaker, or who just want to see the armour they spent good groschen on. If I took the same reversed structs and the same update paths and shipped **Kingdom Gone**, a cheap medieval RPG with suspiciously familiar combat, I doubt the comment would say "good job".

The technique would be identical. **The line was never about the technique.**

## The line was always unwritten

On paper, a lot of modding is prohibited. In practice, most studios settled on a rule they never wrote down, and you can read it off how they treat their modding scenes.

[SKSE](https://skse.silverlock.org/) is a reverse-engineered extension that loads into Skyrim's process and extends its scripting engine, and Bethesda has lived with it for well over a decade. More than lived with it: when the Anniversary Edition update was about to break it in 2021, [Bethesda gave an SKSE developer early access](https://www.nme.com/news/skyrim-anniversary-edition-gave-modder-early-access-to-prevent-modpocalypse-3092998) so a fix could be ready on launch day.[^skse] The SKSE site even points you to Steam to install the build for the original Skyrim.

Larian shipped official mod tools for Baldur's Gate 3, and when it announced them, [said it outright](https://baldursgate3.game/news/community-update-27-official-modding-support_118): "We will never prevent modding outside of our own official pipeline." That outside includes things like Norbyte's [Script Extender](https://github.com/Norbyte/bg3se), which, like SKSE, is a DLL that loads into the game's process and hooks its native code.

The tone changes when reverse engineering produces the game itself instead of an addition to it. re3 and reVC reconstructed the source code of GTA III and Vice City, still needing the original game files to run, and Take-Two had them pulled from GitHub and [sued the developers](https://www.gamedeveloper.com/business/rockstar-parent-take-two-sues-modders-behind-i-gta-i-reverse-engineering-project-re3-). The case [settled quietly](https://www.pcgamer.com/take-two-dismisses-lawsuit-against-grand-theft-auto-modders/) in 2023.[^re3] And then there's the big N, which mostly skips the unwritten part. [Yuzu paid $2.4 million and shut down](https://www.gamingonlinux.com/2024/03/yuzu-agrees-to-pay-nintendo-2-4-million-and-will-entirely-shut-down/), and [Ryujinx went offline](https://www.videogameschronicle.com/news/switch-emulator-ryujinx-has-been-taken-down-after-nintendo-contacted-its-lead-developer/) months later after Nintendo contacted its lead developer. Different targets, same lesson: there's a version of this hobby where you get a "good job", and a version where you get a lawyer.

The rule, as far as I can read it:

- **Make the game better** for people who own it.
- **Don't make money** off someone else's work.
- **Don't hurt** the game's sales or reputation.
- **Don't rebuild the product.**

Stay on that side and most studios look away, or occasionally say good job.

That arrangement held for a reason that has nothing to do with the paper. **Crossing the line was expensive.** One camera system in one game took me the better part of a year of evenings. Rebuilding a whole game took a team years. And the people with the skills mostly came up through communities that taught the norms along with the tools: credit your offsets, credit your sources, don't sell other people's work.

## Then the cost went away

Back to my MIT code. The [MIT license](https://opensource.org/license/mit) is about as permissive as licenses get. You can copy it, modify it, sell it. It asks for exactly one thing in return:

> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

That's the whole price. Two byte-identical files, the price not paid, and the person shipping them had no idea there was a price, because the code arrived through a chat window with no notice attached. The model doesn't keep a citation list. Nobody asked it for one.

There's a cruder version I keep running into, where the model isn't even needed as an excuse: clone a repository, change two lines, open `LICENSE.md` and type your own name over the original author's. MIT lets you do almost anything with someone's code, including adding your own copyright line for your changes. Taking theirs off is the one thing it doesn't allow.

The courts aren't rushing to close the gap either. In September, the Ninth Circuit ruled on the Copilot case, [Doe v. GitHub](https://cdn.ca9.uscourts.gov/datastore/opinions/2026/09/16/24-7700.pdf), and described the tool as "best understood as learning from existing works and then creating new works based on that learning process, not as making copies of existing works". That's a narrow ruling about one DMCA provision on stripping attribution, and the court said plainly that it was not deciding whether the output could infringe copyright.[^dmca] But put that sentence next to the reply in my screenshot and tell me it doesn't read like the same defense.

The same opinion is clear about what that provision does cover: "taking away or changing attribution information from an existing work". Which is a very precise description of editing somebody else's `LICENSE.md`.

## "I just observed how it works"

The other claim I see more and more from people shipping clones: they didn't copy anything, they watched how the original behaves and rebuilt it.

That claim can be completely true, and when it is, it's legitimate. [Clean-room design](https://en.wikipedia.org/wiki/Clean-room_design) is decades old and well understood: one team studies the original and writes a spec, and a second team that has never seen the original implements from that spec. In the EU, observing, studying and testing a program you're licensed to run is a right the license [cannot take away](https://eur-lex.europa.eu/eli/dir/2009/24/oj),[^articles] and in [SAS v World Programming](https://en.wikipedia.org/wiki/SAS_Institute_Inc_v_World_Programming_Ltd) the EU's top court held that a program's functionality isn't protected by copyright at all. World Programming never had SAS's source code and never decompiled it.[^sas] They watched, tested, and rebuilt.

So observation isn't the problem. The problem is that "observation" is now the label on a process nobody can inspect. Here's the pitch for [rea](https://github.com/morluto/rea), an MCP server that hands an agent Ghidra, IDA or Hopper, plus tooling for Electron apps, .NET assemblies and websites:

> See a feature in an app that you want in your own product? Ask your agent to investigate it with REA. It can inspect the app without its source code, explain how the feature works, show the evidence, and build a version for your project.

"Inspect the app without its source code" means reading what shipped: disassembly, decompilation, unpacked bundles, run by an agent and feeding straight into the implementation. The session that read the pseudocode *is* the session that writes the "independent" version. There is no second team. **There is one context window.**

And the last step costs one more sentence: *make it look like I wrote this myself, and remove anything that traces back to the original so I don't have to credit anyone or get sued.* Rename everything, reshape the modules, reword the comments, reorder the arguments. The output stops resembling the input in every way a similarity tool can measure, and it ships as original, observation-based work. Nobody will ever see the prompt.

There's a public, good-faith version of this, and even that one is unresolved. In March, Dan Blanchard, who has maintained [chardet](https://github.com/chardet/chardet) for over twelve years, released 7.0: a ground-up rewrite done with Claude in five days, relicensed from LGPL to MIT. He was open about every step. Empty repository, Claude explicitly told not to look at the old code or base anything on LGPL or GPL code, JPlag run across every release pair, 1.3% maximum similarity to the version before.[^jplag] Mark Pilgrim, chardet's original author, [opened an issue anyway](https://github.com/chardet/chardet/issues/327):

> Adding a fancy code generator into the mix does not somehow grant them any additional rights.

Whatever you think of that dispute, look at what the defense rests on: an instruction in a prompt, and a similarity score that an honest rewrite and a laundered one would both pass. Then look at what happened when Blanchard went back through his own session logs and [published what he found](https://dan-blanchard.github.io/blog/chardet-rewrite-controversy/): a subagent had pulled the old `universaldetector.py`, roughly 567 lines of it, into the model's context while it generated code. His words: "That's exactly the kind of exposure I was trying to avoid, and I'm not going to minimize it."

That's the best case. Twelve years on the project, trying to do it right, in the open, and the instruction still didn't hold. **The only reason anyone knows is that he checked.** Nobody cloning a paid app at 2 AM is going to check.

And here's the part the "I just observed it" crowd always skips: they could only observe it because someone else built it first. The idea, the UX, the hundred small decisions about what the feature should even do, all of that came from the original. Without it there was nothing to observe. The honest clones have always said so: "compatible with", "inspired by", "a reimplementation of". My last technical post ends with <a href="/blog/posts/the-object-already-knows-its-own-name#credits-the-load-bearing-kind" target="_blank" rel="noopener noreferrer">a whole section</a> tracing the lineage of a Cheat Engine script I didn't copy a single line from. No license made me write it. The module wouldn't exist without that script, so the script gets its credit.

## Everything on your machine is readable

Closed source has never meant unreadable. The CPU has to read every instruction, so you can too. What actually protected closed software was the cost of reading it. The license said "don't", and the cost made sure almost nobody did.

rea was created in April and has over 120,000 stars six months later.[^stars] Its [disclaimer](https://github.com/morluto/rea/blob/main/DISCLAIMER.md) is specific and, I think, sincere: it lists "copying proprietary software or reproducing its protected code and assets" as something the project does not support. The tool isn't evil. Neither is Ghidra, or x64dbg, or Cheat Engine, and I'd be a hypocrite to say otherwise.

But a disclaimer is a markdown file, and the agent reads the prompt. A tool that drops the cost of reverse engineering to almost nothing drops it for everyone, and **intent becomes the only filter left**. A world where intent is the only thing standing between a closed-source product and a free clone of it is not one I can imagine wanting to live in.

## The model believes whoever is typing

A friend of mine does 3D work. One of his models on Sketchfab, a cute Shiba Inu, is a paid model and carries the [NoAI tag](https://sketchfab.com/blogs/community/introducing-the-noai-createdwithai-tags/), Sketchfab's opt-out for creators who don't want their work used to build AI. Paid means there's no free download button. It doesn't mean your browser never receives the model. To render it in the viewer, Sketchfab has to send your machine the mesh and the textures, and scripts that pull them back out of the page have been around for years. Same rule as above: if it runs on your computer, it's readable.

He told me he watched someone rip it with an agent. The jailbreak was one sentence: they told Opus the author had messaged them to give permission, so just use the script and rip it. That was it. The price tag, the license and the NoAI tag were all right there on the page. The model had no way to check the permission claim, and **a claim was enough**.

That's not a clever exploit. It's the oldest social engineering trick there is, aimed at something that by design can't pick up a phone and check.

I think we're so done 💀

---

I don't have a solution. I'm not even sure what one would look like.

Licenses and closed source both ran on two assumptions nobody wrote down: that crossing the line took real effort, and that whoever crossed it knew they had. **A license is a note left for the next person who reads the code. Closed source was a long walk.** Agents turned the walk into a prompt, and the next reader of the note is a model that doesn't keep notes, typing for someone who never sees them.

The paper still says what it always said. It just isn't holding anything up anymore. In this era, I honestly can't tell what "licensed" or "closed source" still means beyond *please*.

I'll keep crossing the line for camera mods, knowing exactly where it is, because the people who built the game once told me good job for showing them Henry's back. What scares me is a world where nobody needs to know where the line is, and everyone has an apology ready.

With an em dash in it.

[^skse]: The developer was Extrwi, who got about a week and a half with the new build and had a preliminary SKSE64 2.1 out **roughly an hour before the update went live**. A week and a half is not a lot of time to rebuild a script extender against a game that just switched compilers.

[^re3]: **Dismissed with prejudice** against the four named developers on 3 April 2023, so it can't be refiled against them. Nobody published the terms. The ten John Does in the complaint were dismissed the next day, *without* prejudice, which is lawyer for "we might be back".

[^dmca]: 17 U.S.C. § 1202(b), the DMCA's rule against removing or altering copyright management information. The panel only ruled on the **"output" theory**, that Copilot strips notices when it reproduces code. The **"input" theory**, stripping them from the training set, was treated as forfeited, so *nobody has ruled on that one either*. The exact words: "We express no view on whether that similarity would allow plaintiffs to assert a claim for copyright infringement."

[^articles]: **Article 5(3)** of Directive 2009/24/EC: if you're entitled to run a program, you can observe, study and test it to work out the ideas behind it, and you don't need the rightholder's permission. **Article 8**: any contract term that says otherwise is null and void. The EULA can say what it likes about that part. *It doesn't count.*

[^sas]: Case [C-406/10](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex:62010CJ0406), 2 May 2012. The facts as the court recorded them: World Programming **had no access to the SAS source code and did not decompile it**. They worked from a licensed Learning Edition and the manuals, which is the clean version of "I just observed how it works".

[^jplag]: Blanchard's own table: 0.04% average and **1.30% maximum** similarity for 6.0.0 against 7.0.0, and 0.65% maximum against 1.0. For scale, consecutive older releases score **80 to 93%** against each other. Simon Willison's write-up, taken from the issue thread, quotes 1.29%, so the two sources are not disagreeing.

[^stars]: **121,915 stars** when I checked on 12 October 2026, straight from the GitHub API. The repository was created on 14 April 2026. The README's own milestone banner says 110,000, *with an em dash in it*.
