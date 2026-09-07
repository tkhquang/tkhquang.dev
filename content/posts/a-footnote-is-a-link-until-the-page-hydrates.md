---
title: A Footnote Is a Link Until the Page Hydrates
created_at: 2026-09-07T00:00:00.000Z
updated_at: ""
published: true
category_slug: technical
tags:
  - Next.js
  - React
  - Ljóss
  - Web Development
  - Accessibility
cover_image: /uploads/images/blog/notes-slips-cover.webp
description: "Notes that open beside their mark, links that carry their destination with them, and a frozen copy of every page this blog points at. What remark gives you for free, and what it took to make anyone use it."
---

Every footnote on this page is a link. Write `[^one]` in the text and `[^one]: the note` at the foot, and remark hands you a superscript numeral that jumps to an endnote list, plus an arrow at the end of each note that jumps back.[^one] That is the whole feature, and for a year I told myself it was enough.

It is enough for a printed page, where the foot of the page is an inch away. On a screen the foot of the article is four thousand pixels away, and a reader who follows a numeral to it has to find their line again on the way back. So nobody follows them. I do not follow them on anyone else's site, and I have no reason to think anyone follows mine.

The same goes for the links. A devlog that says "the longer version is in the offsets devlog" is asking the reader to open a second tab, scroll a second article to the right section, read it, and come back. Most readers do the sensible thing and keep going without it.

**All the code here is Next.js 16 with the App Router**, purely because that is what this site runs on. The interesting part is the reading, not the framework. The precedent for nearly all of it is [gwern.net](https://gwern.net/design "preview"), which has been doing recursive link popups for years and documents every decision behind them.

## The margin is taken

The obvious answer is the Tufte one: notes in the margin, beside the sentence that cites them. I tried it first, and the post page said no.

The article sits in the middle of a three-column row. The left flank holds the table of contents, sticky under the header. The right flank holds the "More from Technical" rail, also sticky, with the Reader's Constellation chart absolutely positioned under it. At 1280 pixels each flank is about 240 pixels wide, and the rail already takes 256 of them plus a 16 pixel margin. There is no margin. There is furniture where the margin would be, and I like the furniture.

So the note goes to the reader instead of the gutter. The numeral stays in the text, and the note opens beside it in a slip: a small catalogue card floating next to the mark.[^slip]

## A note is a link until the page hydrates

The mark is the interesting object, because it has to be two things.

In the document as served it is the jump link remark's footnotes come with: an anchor pointing at the note's row in the plate at the foot. That is what a reader without JavaScript gets, and what a crawler gets, and what the first client render has to match or React throws away the whole tree and starts over.

```tsx title="NoteMark.tsx, trimmed"
const interactive = useSyncExternalStore(
  () => () => {},
  () => true, // in the browser, after hydration
  () => false // on the server, and during hydration
);

if (!interactive || !enabled) {
  return <a href={`#${note}`} id={id} className="note-mark">{label}</a>;
}
```

The store snapshot is `false` on the server and `false` during hydration, so the first client render agrees with the HTML. Then it becomes `true`, and the mark re-renders as the button it behaves as: hover it with intent and the slip opens, click it and the slip stays when the pointer leaves, until you click elsewhere, click the numeral again, or press Escape; pin it from its corner and it keeps through all of that until you close it, or press Escape twice.

Hover intent matters more than it sounds. A slip that opens the instant a pointer crosses a numeral is a slip that opens on every scroll past it. Ariakit's hovercard anchor waits for a pointer that is actually moving, not a page scrolling under a resting one, and then for the show timeout, which I set at 150 milliseconds for notes and 250 for links, and it ignores touch entirely, because a finger cannot hover.

The note's text travels with the mark. A rehype plugin runs after the code printing, so the note bodies already carry their inline chips, and copies each note's content into its mark. A note referenced twice is copied twice, because the two marks render as two independent slips. A note that cites another note gets that note's mark inside its copy, so the second slip opens from the first.[^nested] The plate at the foot stays as the printed record, restyled and retitled "Notes", and it is where the marks jump when nothing runs.

## A link earns its slip

The first version gave every link a card. It was wrong, and it took me a day to see why.

A link in a post is usually a citation. It says "this exists and here is where", and the reader takes the author's word for it. Putting a card on every citation turns a page into a minefield of hover targets, and a card that shows a title and a sentence is worse than no card, because the reader still has to open the page to learn anything. The gwern.net build keeps an allowlist of roughly a thousand domains and a hand-written annotation for most links. I have a blog with twenty-four posts.

So a link has to ask. A raw anchor asks with an attribute, a markdown link asks with its title:

```md title="How a post asks for a slip"
<a href="/blog/posts/the-object-already-knows-its-own-name#the-same-failure-three-ways" data-preview>the three failures</a>

[the portals post](/blog/posts/stop-fighting-z-index-stacked-layers-with-react-portals "preview")
```

The title is markup, not a tooltip, and the rehype plugin removes it on the way through. Everything else stays a plain link, and so does a marked link whose destination gives the build nothing to print: no star, no card, just the link.

A link that asked wears a mark: the dot-and-ring star from the asterism, right after its last word.[^mark] The card itself does not open until its content has arrived, so it lands once, at its final size, where there is room for it; while the content is on its way the words turn gilt and breathe, and the star breathes with them. I wanted one tell that reads the same on every device, and a glyph after the words is the only thing that does. With a mouse you hover the words and the card opens and goes when the pointer leaves; click the star and the card stays, with focus inside it, until you click elsewhere or press Escape, and a second click on the star closes it. Press the pin in the card's corner, or drag the card by its head row, the grip beside the pin being the tell, and it pins, the way gwern's popups do: a click elsewhere on the page leaves the card alone, the page scrolls under it while it stays where it was, several can stay open at once, and it goes when you close it with the cross beside the pin, or press Escape twice, once to unpin and once to close. With a finger you tap the star and the card rises as a sheet, while the words keep doing what a link does. From the keyboard, Tab reaches the link, Tab again reaches the star, Enter opens the card with focus inside it, and Escape puts focus back where it was.

## Enough to not go

The bar I set for a card is that the reader should not need to open the destination more often than not. A title and a description do not clear it. These do.

**Another post.** The card carries the entry's shelf, date and instalment, its lede, and then the whole of its opening, transcluded: the finished article markup, chips and plates included, scrolling inside the card. An opening is not the entry, so a line under it says how many sections follow and where to read on; a card that stopped without saying so would read as the whole of it. A link into a section carries the whole section, up to the next heading of the same depth or shallower, with the post's title above so you know whose heading it is. Hover <a href="/blog/posts/the-object-already-knows-its-own-name#the-same-failure-three-ways" data-preview target="_blank" rel="noopener noreferrer">the three failures</a> and you get that section of the RTTI post without leaving this one. The hex diff in it is one of the two plates a card cannot carry, and the card says so in its place.

**GitHub.** An issue or a comment comes back as GitHub's own rendered body through the API's html media type, reduced to GitHub's own sanitizer allowance before it touches this page. The comment where <a href="https://github.com/tkhquang/CrimsonDesertTools/issues/46#issuecomment-4363919777" data-preview target="_blank" rel="noopener noreferrer">Frans posted the EquipHide fix</a> reads in full in its card. A file with a line range comes back with those lines printed by the same press that prints every fence here, both inks, line numbers starting where the link started. A markdown file comes back rendered. A repository comes back with its readme.

**Wikipedia.** The lead, as the encyclopaedia's own previews print it, with the thumbnail: [marginalia](https://en.wikipedia.org/wiki/Marginalia "preview"), for instance.

**YouTube.** The player, on the cookieless domain, because a video's main point is the video.

**Anything else.** What the page's own head says, and then the best copy of it the card can carry. If the page allows itself to be framed, the card frames it live. Of the destinations this blog links, few do: GitHub, Steam, Nexus and the Next.js docs all send `X-Frame-Options: deny` or a `frame-ancestors` that names only themselves. Wikipedia, react.dev, the Unity manual and YouTube's embed domain do not mind. For the rest, the card shows the snapshot.

## Frozen at publish

The snapshot is the part I did not plan and now would not remove.

The press that renders the diagrams on this site already runs a headless Chromium at build time. So at build, every destination that is only a page, with no GitHub or Wikipedia reader to speak for it, is opened in that browser at 1280 by 800, scrolled to load its lazy pictures, and photographed down to 2000 pixels as a webp under `public/uploads/archive/`. The card shows that picture when the page cannot be framed, and the picture is served by this site for as long as this site stands. When the destination changes its layout, or its mind, or goes away, the card still shows what I was pointing at when I wrote the sentence.

The Wayback Machine gets a copy too, or is asked for one, for every destination off the site. Save Page Now answers a plain `GET` without an account, slowly and with a rate limit that answers `429` the moment it is leaned on, so the save is a request rather than a promise: when it is refused, the build looks up whatever copy already exists, and a card whose page is archived prints "Archived copy" in its foot. A page without one is asked about again a week later.

Nothing about this happens when you read. Every card is a JSON file written at build under `/blog/slips/`, one per link, named by twelve hex characters of the link's hash. The page carries only the markers; the card is fetched when the pointer starts moving toward the link, so it is usually there before the show timeout is. The annotations live in `content/annotations/`, one file per link, committed with the post, so the next build reads the file and asks the network only for a copy it does not have yet.

## Off

Some readers hate things that open under a resting pointer, and they are not wrong to. The foot of every card carries "Turn hover previews off". It sets one key in `localStorage` and a pointer resting on a link does nothing after that. The star stays, and a click on it still opens the card, because a click is the reader's own hand and not an accident of where the pointer came to rest; the foot of that card is where the switch goes back on. Notes are not part of the deal. A note is my own text, already on the page, and a numeral that stops answering would be a broken numeral, so notes hover and pin whatever the switch says.

## What it does not do

A nested slip stops at one level of the same note: a note that cites itself keeps remark's plain link rather than opening forever.

A page that refuses a headless browser gets no snapshot. Nexus Mods sits behind a bot check that answers `403` to anything without a pulse, headless Chromium included, so a link there gets no snapshot and no card: it stays the link it was.

The section card transcludes the section as it is, with two exceptions it names: the camera plate and the hex diff are interactive islands that do not survive a copy, so the card prints a line saying what was left out and where to find it.

On a finger the words of a link navigate. There is no long-press preview. The star is the preview, and it is a 24 pixel target, which is the floor for a finger and the reason the numerals and stars grow a halo you cannot see on touch screens only. It keeps the desktop's rule too: the sheet rises once the card is there, the words and the star breathing until then, so nothing rises empty and refills under a thumb.

And the whole thing is opt-in, so most links on this blog will never have a card. That is the point. The ones that do are the ones where I looked at the destination and decided you should not have to.

[^one]: This is one. Hover the numeral on a mouse, tap it on a phone, or press Enter on it from the keyboard. The plate at the foot of the article still lists it, and still has the arrow back.

[^slip]: The word is borrowed from the library, where a slip is the card a cataloguer tucks into the drawer to say where something else is shelved. The cards here are dressed like the rest of the site's furniture: the raised surface, the hairline, the gilt rule at the head for a note, the shelf's own hue for a cross-reference to another post, and the site's lapis for one that leaves it.

[^nested]: The mark inside this note belongs to <a href="/blog/posts/stop-fighting-z-index-stacked-layers-with-react-portals" data-preview target="_blank" rel="noopener noreferrer">the portals post</a>, which is where the stacked layers these slips render into came from. Hover it and a second slip opens over this one. Ariakit nests the second portal inside the first rather than beside it in the layer, so it paints on top without a z-index to argue about.

[^mark]: The star is the asterism's dot-and-ring figure drawn at nine pixels, in the deeper gilt the chart plates print their labels in, because the plain gilt ink sits at 3.7 to 1 on light paper at that size and the deeper step clears 4.5.
