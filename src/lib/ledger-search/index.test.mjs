/* These tests exercise the committed module through the browser interface. */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createEngine, FORMAT_VERSION } from "./engine.ts";
import { MARK_CLOSE, MARK_OPEN } from "./protocol.ts";
import { toLedgerEntries } from "./reading-text.ts";

const source = readFileSync(
  new URL("../../../public/search/ljoss-search.wasm", import.meta.url)
);

async function engine() {
  const { instance } = await WebAssembly.instantiate(source, {});
  return createEngine(instance);
}

const entry = (fields) => ({
  body: "",
  date: "2026-03-01T00:00:00.000Z",
  dateLabel: "01/03/2026",
  slug: "an-entry",
  title: "An Entry",
  ...fields,
});

/* The build preserves the roster's newest-first order. */
const ENTRIES = [
  entry({
    body: "Every Letter in This PDF Is a Drawing\nFollowing the font files led from Next.js down to Chromium and Skia.",
    slug: "pdf",
    title: "Every Letter in This PDF Is a Drawing",
  }),
  entry({
    body: "The Foundation of Ljóss\nLjóss is the journal this site prints. I use server rendering for the article body.",
    date: "2025-11-02T00:00:00.000Z",
    dateLabel: "02/11/2025",
    slug: "foundation",
    title: "The Foundation of Ljóss",
  }),
  entry({
    body: "The Object Already Knows Its Own Name\nWalking the vtable reaches the RTTI descriptor. C++ writes the name down, and deleting sw.js does not help.",
    date: "2025-04-05T00:00:00.000Z",
    dateLabel: "05/04/2025",
    slug: "rtti",
    title: "The Object Already Knows Its Own Name",
  }),
];

async function loaded() {
  const built = await engine();
  const index = built.build(ENTRIES);
  assert.equal(built.load(index), true);
  return { engine: built, index };
}

const slugs = (answer) => answer.results.map((result) => result.slug);

test("the committed module speaks the format this build expects", async () => {
  const built = await engine();
  assert.ok(built, `module did not report format ${FORMAT_VERSION}`);
});

test("an index written here is read back here", async () => {
  const { engine: built, index } = await loaded();

  assert.ok(index.byteLength > 0);
  assert.equal(new TextDecoder().decode(index.subarray(0, 4)), "LJIX");
  assert.equal(built.load(index), true);
});

test("a replacement index discards cached offsets for reused document IDs", async () => {
  const { engine: built } = await loaded();

  assert.deepEqual(slugs(built.search("skia ", 10)), ["pdf"]);

  const writer = await engine();
  const body = "An überlong preface. The vtable reaches a different location.";
  const replacement = writer.build([entry({ body, slug: "replacement" })]);

  assert.equal(built.load(replacement), true);

  const answer = built.search("vtable ", 10);

  assert.deepEqual(slugs(answer), ["replacement"]);
  assert.ok(
    answer.results[0].snippet.includes(`${MARK_OPEN}vtable${MARK_CLOSE}`)
  );
  assert.equal(
    answer.results[0].snippet
      .replaceAll(MARK_OPEN, "")
      .replaceAll(MARK_CLOSE, ""),
    body
  );
});

test("a file the module cannot read is refused rather than trusted", async () => {
  const built = await engine();
  const index = built.build(ENTRIES);

  const wrongMagic = Uint8Array.from(index);
  wrongMagic[0] = 0x58;
  assert.equal(built.load(wrongMagic), false);

  const truncated = index.subarray(0, 16);
  assert.equal(built.load(truncated), false);
});

test("a word only the prose holds is reachable", async () => {
  const { engine: built } = await loaded();

  assert.deepEqual(slugs(built.search("vtable ", 10)), ["rtti"]);
  assert.deepEqual(slugs(built.search("skia ", 10)), ["pdf"]);
});

test("every word of a query has to land", async () => {
  const { engine: built } = await loaded();

  assert.deepEqual(slugs(built.search("font chromium ", 10)), ["pdf"]);
  assert.deepEqual(slugs(built.search("vtable chromium ", 10)), []);
});

test("multiline queries preserve the final word's prefix behavior", async () => {
  const { engine: built } = await loaded();
  const expected = built.search("font chrom", 10);

  assert.deepEqual(slugs(expected), ["pdf"]);
  assert.deepEqual(built.search("font\nchrom", 10), expected);
  assert.deepEqual(built.search("\r\nfont\r\nchrom", 10), expected);
  assert.deepEqual(slugs(built.search("font\nchrom\n", 10)), []);
});

test("an accented title answers to the letters a reader can type", async () => {
  const { engine: built } = await loaded();
  assert.deepEqual(slugs(built.search("ljoss ", 10)), ["foundation"]);
});

test("a punctuated name survives the round trip", async () => {
  const { engine: built } = await loaded();

  assert.deepEqual(slugs(built.search("c++ ", 10)), ["rtti"]);
  assert.deepEqual(slugs(built.search("sw.js ", 10)), ["rtti"]);
});

test("a result carries what a row needs and nothing else", async () => {
  const { engine: built } = await loaded();
  const [result] = built.search("skia ", 10).results;

  assert.deepEqual(Object.keys(result).sort(), [
    "date",
    "dateLabel",
    "slug",
    "snippet",
    "title",
  ]);
  assert.equal(result.slug, "pdf");
  assert.equal(result.date, "2026-03-01T00:00:00.000Z");
  assert.equal(result.dateLabel, "01/03/2026");
});

test("a snippet is prose from the entry with the match wrapped", async () => {
  const { engine: built } = await loaded();
  const [result] = built.search("vtable ", 10).results;

  assert.ok(result.snippet.includes(`${MARK_OPEN}vtable${MARK_CLOSE}`));
  assert.ok(result.snippet.includes("RTTI descriptor"));

  const oneLine = (text) => text.replace(/\s+/g, " ").trim();
  const plain = oneLine(
    result.snippet.replaceAll(MARK_OPEN, "").replaceAll(MARK_CLOSE, "")
  );
  assert.ok(oneLine(ENTRIES[2].body).includes(plain));
});

test("a capped answer still reports how many entries matched", async () => {
  const { engine: built } = await loaded();

  const capped = built.search("the ", 1);
  assert.equal(capped.total, 3);
  assert.equal(capped.results.length, 1);
});

test("a query the corpus cannot answer returns nothing at all", async () => {
  const { engine: built } = await loaded();

  assert.deepEqual(built.search("webgpu ", 10), { results: [], total: 0 });
  assert.deepEqual(built.search("", 10), { results: [], total: 0 });
  assert.deepEqual(built.search("   ", 10), { results: [], total: 0 });
});

test("a query longer than one page of memory is still answered", async () => {
  const { engine: built } = await loaded();

  /* The query allocation exceeds one memory page and detaches existing views. */
  const long = `${"padding ".repeat(20_000)}vtable `;
  assert.deepEqual(slugs(built.search(long, 10)), []);
  assert.deepEqual(slugs(built.search("vtable ", 10)), ["rtti"]);
});

const post = (content) => ({
  category_title: "Technical",
  content,
  created_at: new Date("2026-03-01T00:00:00.000Z"),
  description: "One sentence of lede.",
  slug: "a-post",
  tags: ["Fonts", "PDF"],
  title: "A Post",
});

const bodyOf = async (content) =>
  (await toLedgerEntries([post(content)]))[0].body;

test("the title and lede open an entry and the subjects close it", async () => {
  assert.equal(
    await bodyOf("The prose."),
    "A Post ·\nOne sentence of lede.\nThe prose.\nFonts, PDF ·\nTechnical"
  );
});

test("code is searchable and markup is not", async () => {
  const body = await bodyOf(
    [
      "The crash was `0xC0000005`.",
      "",
      "```c",
      "HRESULT hr = CoInitialize(nullptr);",
      "```",
      "",
      '<pre class="mermaid">',
      "flowchart TD",
      "  A[Source] --> B[Server]",
      "</pre>",
      "",
      '<camera-explorable lesson="orbit"></camera-explorable>',
    ].join("\n")
  );

  assert.ok(
    body.includes("0xC0000005"),
    "an inline code span is reading matter"
  );
  assert.ok(body.includes("CoInitialize"), "a fence is reading matter");
  assert.ok(!body.includes("flowchart"), "diagram syntax is not");
  assert.ok(!body.includes("camera-explorable"), "an element name is not");
});

test("a heading and its paragraph do not run into one word", async () => {
  const body = await bodyOf("## The fix\n\nIt was the font.");

  assert.ok(body.includes("The fix\nIt was the font."));
});

test("a raw element parts the line whatever Markdown files it under", async () => {
  /* A tag that cannot start an HTML block in that position, which is every
     custom element, parses as inline HTML inside the paragraph when no blank
     line surrounds it. A rule that read the parent node therefore joined the
     sentences and awarded a phrase bonus across a break the reader can see. */
  for (const element of [
    '<camera-explorable lesson="collision"></camera-explorable>',
    "<camera-explorable />",
    '<pre class="mermaid">flowchart TD</pre>',
  ]) {
    const spaced = await bodyOf(
      `Sentence one ends here.\n\n${element}\n\nSentence two starts here.`
    );
    const tight = await bodyOf(
      `Sentence one ends here.\n${element}\nSentence two starts here.`
    );

    assert.equal(tight, spaced, element);
    assert.ok(!tight.includes("here. Sentence"), element);
    assert.ok(
      tight.includes("Sentence one ends here.\nSentence two starts here.")
    );
  }
});

test("every tag on the inline list keeps its sentence in one line", async () => {
  for (const [marked, plain] of [
    ["Reaching <span>tinted</span> prose.", "Reaching tinted prose."],
    [
      'Reaching <a href="/blog">the archive</a> prose.',
      "Reaching the archive prose.",
    ],
    ["Reaching <cite>a source</cite> prose.", "Reaching a source prose."],
    ["Reaching <sup>1</sup> prose.", "Reaching 1 prose."],
    ["Reaching <kbd>Escape</kbd> prose.", "Reaching Escape prose."],
  ]) {
    assert.equal(await bodyOf(marked), await bodyOf(plain), marked);
  }
});

test("hard line breaks keep the words on both sides searchable", async () => {
  for (const content of [
    "Alpha  \nbeta.",
    "Alpha\\\nbeta.",
    "Alpha<br>beta.",
    "Alpha<br />beta.",
    'Alpha<br class="line-break">beta.',
  ]) {
    const entries = toLedgerEntries([post(content)]);
    const built = await engine();

    assert.equal(built.load(built.build(entries)), true);
    assert.deepEqual(slugs(built.search("alpha beta ", 10)), ["a-post"]);
    assert.ok(entries[0].body.includes("Alpha\nbeta."));
  }
});

test("soft wraps preserve the same searchable phrase as a single line", async () => {
  const singleLine = await bodyOf("The alpha beta pair.");

  for (const content of ["The alpha\nbeta pair.", "The alpha\r\nbeta pair."]) {
    assert.equal(await bodyOf(content), singleLine);
  }
});

test("inline HTML preserves phrase and identifier continuity", async () => {
  const plain = "An important point about C++.";
  const marked =
    'An <em>important</em> point about <span class="code">C</span>++.';
  const entries = toLedgerEntries([post(marked)]);
  const built = await engine();

  assert.equal(entries[0].body, await bodyOf(plain));
  assert.equal(built.load(built.build(entries)), true);
  assert.deepEqual(slugs(built.search("important point c++ ", 10)), ["a-post"]);
  assert.ok(!entries[0].body.includes("class"));
});

test("code lines retain the boundaries that the reader sees", async () => {
  const body = await bodyOf("```text\nAlpha\nbeta.\n```");

  assert.ok(body.includes("Alpha\nbeta."));
  assert.ok(!body.includes("Alpha beta."));
});

test("a figure caption is reading matter and stands on its own line", async () => {
  /* The caption is printed under the image, so a reader can come back for it,
     but it reaches the indexer as a property of the image node rather than as a
     child of it. */
  const body = await bodyOf(
    [
      "Before the plate.",
      "",
      "![The black cat knows where I have been.](/uploads/cat.jpg)",
      "",
      "After the plate.",
    ].join(String.fromCharCode(10))
  );

  assert.ok(body.includes("The black cat knows where I have been."));
  assert.ok(!body.includes("uploads"), "the address is not reading matter");
  assert.ok(!body.includes("plate. The black"), "a caption is its own line");
  assert.ok(!body.includes("been. After"), "and the prose after it is another");
});

test("a caption answers a query that no other line can", async () => {
  const entries = toLedgerEntries([
    post("Only prose here.![A lynx in the undergrowth.](/uploads/lynx.jpg)"),
  ]);
  const built = await engine();

  assert.equal(built.load(built.build(entries)), true);
  assert.deepEqual(slugs(built.search("lynx undergrowth ", 10)), ["a-post"]);
  assert.equal(built.search("uploads ", 10).total, 0);
});

test("link text is kept and its target is not", async () => {
  const body = await bodyOf("See [the RTTI post](/blog/posts/the-object).");

  assert.ok(body.includes("the RTTI post"));
  assert.ok(!body.includes("/blog/posts/the-object"));
});

test("a post with a missing shelf still yields a body", async () => {
  const entries = await toLedgerEntries([
    { ...post("Text."), category_title: undefined },
  ]);

  assert.ok(entries[0].body.startsWith("A Post ·\n"));
  assert.ok(entries[0].body.endsWith("Fonts, PDF"));
});

test("a link the page turns into a player is not indexed as its address", async () => {
  const body = await bodyOf(
    [
      "Before the video.",
      "",
      "https://www.youtube.com/watch?v=HWF5_wdqQj0",
      "",
      "After it.",
    ].join("\n")
  );

  assert.ok(!body.includes("youtube"), body);
  assert.ok(!body.includes("HWF5_wdqQj0"), body);
  assert.ok(body.includes("Before the video."));
  assert.ok(body.includes("After it."));
});

test("an ordinary link keeps its text, which the page does print", async () => {
  const body = await bodyOf("See [the RTTI post](https://example.test/rtti).");

  assert.ok(body.includes("the RTTI post"));
  assert.ok(!body.includes("example.test"));
});
