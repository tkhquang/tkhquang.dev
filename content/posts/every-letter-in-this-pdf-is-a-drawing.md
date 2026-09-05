---
title: "Every Letter in This PDF Is a Drawing"
created_at: 2026-03-01T00:00:00.000Z
updated_at: 2026-08-20T00:00:00.000Z
published: true
category_slug: technical
tags:
  - Next.js
  - Chromium
  - Puppeteer
  - PDF
  - Fonts
  - Web Development
cover_image: /uploads/images/blog/pdf-fonts-cover.webp
description: "Chromium drew my resume by hand: a PDF with zero font programs. The trigger is one branch in Skia, and pinning font weights does not dodge it."
---

The resume on this site is a web page. A route points Chromium at it through Puppeteer, prints it to PDF, and a GitHub workflow curls the deployed endpoint and commits the bytes, so the file sitting in `public/` is genuine production output. It has worked for over a year and it looks perfect.

One evening I got curious about what was actually inside it. A PDF wears most of its structure in plain text, so the dumbest probe there is already answers: scan the raw bytes and count the font dictionary keys.

```bash
grep -aoE '/FontFile2|/Subtype /Type0|/Subtype /Type3|/CharProcs' resume.pdf | sort | uniq -c
```

I expected nothing worth writing about. What came back, tidied up:

```text title="Quang-Resume.pdf, 363,666 bytes"
/Producer (Skia/PDF m137)

/FontFile2   0    embedded TrueType font programs
/Type0       0    composite fonts that would reference them
/Type3      27    fonts whose glyphs are inline drawings
/CharProcs  27
```

Zero embedded font programs. The file names nine faces, subset prefixes `AAAAAA+` through `IAAAAA+`, most of them `Inter-Regular`, and none of them contains a byte of the typeface it names. Every glyph on every page is a Type3 `CharProc`: a small vector drawing of a letter, stored once per font that uses it. Summed up, the letter drawings are roughly three quarters of the file.

![One page, two ways to say "Q"](/uploads/images/blog/pdf-fonts-type3-vs-embedded.svg)

Before the tour, the honest caveat: nothing was visibly broken. The PDF is tagged, every Type3 font carries a `/ToUnicode` CMap, and any parser that walks those CMaps gets clean text out. This is a story about size, about correctness of form, and mostly about a fix I believed in that turned out to do nothing.

**All the measurements here are Chromium's print-to-PDF**, which is Skia's PDF backend, against a Next.js 16 site, because that's what this blog runs. The delivery half is `next/font`; the refusal half is Skia, and it applies to anything that prints through Chromium: Puppeteer, Playwright, headless `--print-to-pdf`, the Save as PDF dialog.

## One Variable at a Time

A finding like this arrives with a lineup of suspects. woff2 compression. `font-display: swap`. The print stylesheet. `font-feature-settings`. Some Puppeteer flag. Every one of them has a blog post somewhere naming it the culprit, so I stopped reading and started rendering: one throwaway page, same Chromium, same print settings as production, one font decision changed per run.

| the face on the page | /FontFile2 | /Type3 | |
| --- | --- | --- | --- |
| system font (Arial, from the OS) | 2 | 0 | embeds |
| web font, static TTF | 1 | 1 | embeds; the stray Type3 is a synthesized bold |
| web font, variable TTF (Bahnschrift) | 0 | 4 | never embeds |
| web font, variable woff2 | 0\* | 2 | never embeds |
| `font-feature-settings: "cv02", ...` on and off | no change | no change | red herring |

\* one FontFile2 did appear in that run, and it belonged to the fallback face that got a frame on screen, not to the web font. Controlled experiments are full of small humiliations like that.

Two candidates left standing: the variable axes, or woff2. So, the decisive pair. Same delivery, same `@font-face` shape, both files emitted by `next/font` itself into `.next/static/media`, both rendered in the same document. Only the file differs:

| file | /FontFile2 | /Type3 |
| --- | --- | --- |
| static woff2 (Merriweather 400) | **1** | 0 |
| variable woff2 (Inter) | 0 | 2 |
| variable woff2 (Montserrat) | 0 | 1 |
| variable woff2 (Source Code Pro) | 0 | 1 |

The static woff2 embedded fine, which kills the compression theory. The rows that fail share exactly one property.

**Skia refuses to embed a variable typeface. It draws every glyph as a path instead.**

## The Obvious Fix, Measured

If variable fonts are the trigger, the fix writes itself. `next/font/google` takes a `weight` option; pin the three weights the resume uses, get three static files, done.

```tsx title="app/(resume)/layout.tsx, the fix that does not fix" showLineNumbers
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});
```

I shipped that, rebuilt, re-rendered, and measured. Still zero `/FontFile2`. The Type3 count went *up*, 27 to 31. The fix that everyone would write, that I would have approved in review, that reads like it obviously works, does nothing.

The generated CSS says why:

```text title="the @font-face rules the build emitted, trimmed"
Inter  w=400  s=normal   83afe278b6a6bb3c-s.p.3a6ba036.woff2
Inter  w=600  s=normal   83afe278b6a6bb3c-s.p.3a6ba036.woff2
Inter  w=700  s=normal   83afe278b6a6bb3c-s.p.3a6ba036.woff2
```

Three weights, one file. Parsing that file's WOFF2 table directory turns up an `fvar` table, which is the variable font announcing itself. All three rules point at the same variable file the unpinned version used.

![Three descriptors, one download](/uploads/images/blog/pdf-fonts-three-rules-one-file.svg)

The `weight` option sets the `font-weight` *descriptor* on each `@font-face` rule, and it does reach Google: `next/font/google` encodes the pinned weights into the css2 URL it requests, hardcoded in its `get-google-fonts-url.js`. But whether static instances stand behind a pinned weight is Google's per-family call, not something the option controls, and for Inter, css2 answers all three pinned weights with the same variable file. In the same pipeline, Merriweather 400 came back as a true static instance, which is exactly the decisive-pair row that embedded. The descriptor changed. For this family, the bytes did not. Of the 31 woff2 files in that build's `.next/static/media`, 26 carried `fvar`, and Merriweather's static instances were the holdouts.

The giveaway had been sitting in the committed PDF the whole time, and I misread it. The mono face is named `GAAAAA+SourceCodePro-ExtraLight`. Nothing on this resume asks for ExtraLight; the CSS wants a plain 400. But the Source Code Pro variable file defaults to weight 200, and Skia names a variable face after its **default instance**, not after the instance you rendered. My probe PDFs said `Inter-Thin` for the same reason. (The committed PDF's Inter faces say `Regular`, so the slice its build pulled evidently defaulted there; the Source Code Pro face is what kept the evidence visible.) A weight you never asked for, in a font name, is the variable file waving at you.

## The Fix That Works

The file itself has to change, so the delivery has to change. I proved the mechanism first with the static per-weight TTFs Google still serves to legacy user agents, on the probe page:

| | bytes | /FontFile2 | /Type0 | /Type3 | FontName |
| --- | --- | --- | --- | --- | --- |
| variable woff2 | 44,065 | 0 | 0 | 6 | `Inter-Thin`, three times |
| static TTFs | **14,101** | **3** | **3** | **0** | `Inter-Regular`, `Inter-SemiBold`, `Inter-Bold` |

68% smaller, and the names are finally the weights on the page. Embedding a subset font program is much cheaper than shipping a drawing of every letter you used, which is a sentence that sounds backwards until you remember the drawings repeat per font.

No `next/font` option gets you those files. What does is [@fontsource](https://fontsource.org/), which publishes every Google family as static per-weight instances under the real family names. That last part is what makes the change small here: the resume's CSS already asks for `"Inter"` and `"Source Code Pro"` by name through its `--font-sans-inter` and `--font-mono` stacks, so swapping what stands behind the `@font-face` rules touches no CSS and no page markup. The route's layout drops `next/font/google` and imports the five faces the resume actually uses:

```tsx title="app/(resume)/layout.tsx" showLineNumbers
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-400-italic.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/source-code-pro/latin-400.css";
```

Same page, same print settings, measured either side:

| | bytes | /FontFile2 | /Type0 | /Type3 | /CharProcs |
| --- | --- | --- | --- | --- | --- |
| committed production PDF | 363,666 | 0 | 0 | 27 | 27 |
| local build, variable Inter | 364,550 | 0 | 0 | 31 | 31 |
| local build, static faces | **125,272** | **11** | **11** | **0** | **0** |

66% smaller, zero Type3, and the PDF finally contains fonts: `Inter-Regular`, `Inter-SemiBold`, `Inter-Bold`, `Inter-Italic`, and a Source Code Pro face that answers to `SourceCodeProExtraLight-Regular`. After a whole investigation of being lied to by font names, I parsed that file's name table before trusting it: the ExtraLight is baked into the file fontsource ships as its 400, a fossil of the variable font it was instanced from, and the `@font-face` rule registers it as a plain 400 regardless. A wrong name on a real font program beats a right name on no font at all.

Everything else held still: 3 pages, the same MediaBox, `/ToUnicode` on every embedded font, and a screenshot diff of the rendered page shows no change. The rest of the site keeps its variable fonts, because the screen was never the problem.

## Reading the Branch

"Skia refuses" is the kind of claim I didn't want to leave black-box, and it doesn't have to be. The decision is one branch, in [`SkPDFFont::FontType`](https://github.com/google/skia/blob/chrome/m137/src/pdf/SkPDFFont.cpp#L330-L352), and a variable typeface is the *first* condition, ahead of licensing and CFF. This is the source at chrome/m137, the exact version stamped in the committed PDF's `/Producer`:

```cpp title="skia/src/pdf/SkPDFFont.cpp, chrome/m137, trimmed"
if (SkToBool(metrics.fFlags & SkAdvancedTypefaceMetrics::kVariable_FontFlag) ||
    // PDF is actually interested in the encoding of the data, not just the logical format.
    // If the TrueType is actually wOFF or wOF2 then it should not be directly embedded in PDF.
    // For now export these as Type3 until the subsetter can handle table based fonts.
    SkToBool(metrics.fFlags & SkAdvancedTypefaceMetrics::kAltDataFormat_FontFlag) ||
    SkToBool(metrics.fFlags & SkAdvancedTypefaceMetrics::kNotEmbeddable_FontFlag) ||
    metrics.fType == SkAdvancedTypefaceMetrics::kCFF_Font ||
    pdfStrike.fHasMaskFilter)
{
    // force Type3 fallback.
    return SkAdvancedTypefaceMetrics::kOther_Font;
}
```

There's no flag on the other side of that `if`. It isn't a Chromium switch, a Puppeteer option, or a print setting; it's a hard branch in the renderer, and the only way through it is to hand Skia a font it's willing to embed.

The wOFF clause nearly fooled me a second time. Read it next to the Merriweather result and it explains itself: woff2 is fatal, my static woff2 embedded anyway, so some subsetter machinery must have saved it. [Current Skia](https://github.com/google/skia/blob/main/src/pdf/SkPDFFont.cpp) has even grown exactly that escape hatch, a `!SkPDFCanSubsetTableBasedFonts()` guard on this clause, but it landed around m147, and neither the m137 that produced the committed PDF nor the Chromium my probes ran carries it. On every binary I measured, a font that reaches this branch as woff2 goes Type3, no conditions attached.

Which is the tell, because my static woff2 embedded anyway. The only way both facts hold is that Skia never saw woff2 bytes, and it never does: Blink runs every downloaded web font through the OTS sanitizer, which decompresses WOFF and WOFF2 into raw sfnt data before the typeface exists. By the time the PDF code asks its questions, Merriweather is plain TrueType and passes clean. Inter went through the same decompression and still failed, because decompression preserves the one thing OTS has no reason to remove: the `fvar` table. Inside a browser this whole clause is dead code, kept for embedders that hand Skia actual wOFF bytes, and the only condition that ever separated my rows is the first one.

<pre class="mermaid flex justify-center">
graph TD
    F1["Merriweather 400<br/>static woff2"] --> C["SkPDFFont::FontType"];
    F2["Inter<br/>variable woff2"] --> C;
    F1 ~~~ F3["Montserrat<br/>variable woff2"];
    F2 ~~~ F4["Source Code Pro<br/>variable woff2"];
    F3 --> C;
    F4 --> C;
    C -->|"OTS decompressed<br/>it on download:<br/>plain TrueType,<br/>no flags, pass"| E["embedded<br/>/FontFile2, subset"];
    C -->|"fvar survived<br/>decompression:<br/>kVariable_FontFlag,<br/>no appeal"| T["Type3 fallback<br/>every glyph a drawing"];

    classDef default fill:#282a36,stroke:#f8f8f2,stroke-width:2px,color:#f8f8f2;
    classDef bad fill:#282a36,stroke:#ff5555,stroke-width:2px,color:#ff5555;
    classDef good fill:#282a36,stroke:#50fa7b,stroke-width:2px,color:#50fa7b;
    class C,F2,F3,F4 default;
    class T bad;
    class F1,E good;
</pre>

Two more things fall out of the same dozen lines for free. The CFF condition explains [puppeteer#7401](https://github.com/puppeteer/puppeteer/issues/7401), where `.otf` files land in PDFs as "Type 3 Custom": identical symptom, different trigger, which is why threads about it never converge. And `--font-render-hinting=none`, the flag half the internet prescribes for Puppeteer font problems, is nowhere near this code path. It can't be the fix, because the branch never consults it.

## Where It Doesn't Save You

**Nothing here rescued a broken resume, because the resume was not broken.** Type3 with `/ToUnicode` extracts fine, and the file was tagged all along. If you came to this post from an "ATS can't read your PDF" scare, measure before you migrate: walk the CMaps or run an extractor over your actual file. Mine passed the whole time. The wins here are 66% of the file size and a PDF whose fonts are fonts.

**A descriptor will never be a file.** The `weight` option pins a descriptor and `font-variation-settings` picks an instance at render time; neither changes what css2 serves. Even `axes`, the one option that does change the request, only ever gets you a different *variable* slice, same flag, same branch. If the fix you're about to ship doesn't change which bytes go over the wire, it won't change what Skia sees.

**Pinning weights means pinning weights.** The route now loads exactly five faces. Ask for a sixth and the browser will synthesize it, and the probe already showed what a synthesized bold becomes in print: a Type3 drawing, quietly, in an otherwise clean PDF.

**One environment was measured.** Everything above ran against local Chromium, not the `@sparticuz/chromium` build the production Lambda actually runs. Same Skia, but I've spent this whole post being burned by "same, surely", so the committed artifact gets re-probed after the next workflow run before I call it closed.

## The Cheap Bug and the Expensive Fix

The original bug cost me nothing. It shipped a fat PDF for a year and nobody noticed, including me.

The weight-pinning fix is the part that would have cost me, because it's plausible, it's documented-adjacent, it compiles, the page still renders beautifully, and it does nothing. If I had shipped it without re-running the probe, the investigation would have closed with the bug still in place and a changelog entry saying it was fixed. The uncomfortable habit this keeps teaching me: the measurement that found the bug has to run again on the fix, every time, no matter how obviously the fix works.

If you print PDFs through Chromium in any form, [poppler](https://poppler.freedesktop.org/)'s `pdffonts` is the thirty-second version of this whole post:

```bash
pdffonts document.pdf
```

If the `type` column says `Type 3` for fonts you know are TrueType, nothing is missing and nothing failed. Skia looked at your beautiful variable font, declined to embed it, and drew.
