import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

import * as sanitize from "./sanitize.ts";

// Node needs the bundler extensionless sanitize import resolved explicitly.
const { outputText } = ts.transpileModule(
  readFileSync(new URL("./extract.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }
);
const require = createRequire(import.meta.url);
const extract = { exports: {} };
new Function("require", "module", "exports", outputText)(
  (specifier) => (specifier === "./sanitize" ? sanitize : require(specifier)),
  extract,
  extract.exports
);
const { extractReadable } = extract.exports;

const BASE = "https://example.com/piece";

/* A page shaped the way most pages are: the words wrapped twice, with a
   menu, a sidebar of links and a footer around them */
const page = (body) => `<!doctype html><html><head><title>A piece</title>
</head><body>
  <header><h1>The Site</h1></header>
  <nav><a href="/a">One</a> <a href="/b">Two</a> <a href="/c">Three</a></nav>
  <div class="wrapper"><div class="post-content">${body}</div></div>
  <aside class="related"><a href="/x">Something else entirely</a></aside>
  <footer>Copyright</footer>
</body></html>`;

const prose = `
  <p>The first paragraph carries the argument and is long enough that a reader would call it a paragraph rather than a caption or a stray line of chrome.</p>
  <p>The second paragraph continues it, at similar length, so the container holding them both scores above anything else on the page by a wide margin.</p>
  <p>A third, again long enough to count toward the score, because two alone would make the test depend on a threshold rather than on the shape of the page.</p>
`;

test("the page's own words are kept and its furniture is not", () => {
  const html = extractReadable(page(prose), BASE);
  assert.ok(html, "an extract was produced");
  assert.match(html, /first paragraph carries the argument/);
  assert.match(html, /second paragraph continues it/);
  assert.doesNotMatch(html, /Something else entirely/);
  assert.doesNotMatch(html, /Copyright/);
  assert.doesNotMatch(html, /The Site/);
});

test("scripts, styles and frames never survive", () => {
  const html = extractReadable(
    page(
      `${prose}<script>alert(1)</script><style>p{color:red}</style><iframe src="https://elsewhere.test"></iframe>`
    ),
    BASE
  );
  assert.ok(html);
  assert.doesNotMatch(html, /alert\(1\)/);
  assert.doesNotMatch(html, /color:red/);
  assert.doesNotMatch(html, /<iframe/);
});

test("a page with nothing to say yields nothing rather than noise", () => {
  assert.equal(extractReadable(page("<p>Too short.</p>"), BASE), null);
  assert.equal(extractReadable("<html><body></body></html>", BASE), null);
});

test("a wall of links is not prose", () => {
  const links = Array.from(
    { length: 40 },
    (_, i) =>
      `<p><a href="/item-${i}">An item in a list of links number ${i}</a></p>`
  ).join("");
  assert.equal(extractReadable(page(links), BASE), null);
});

test("relative links are resolved against where the page answered", () => {
  const html = extractReadable(
    page(`${prose}<p>See <a href="/deeper">the other page</a> for more.</p>`),
    BASE
  );
  assert.ok(html);
  assert.match(html, /https:\/\/example\.com\/deeper/);
});

test("the extract is capped, and cut between blocks", () => {
  const long = Array.from(
    { length: 60 },
    (_, i) =>
      `<p>Paragraph number ${i} which runs on for a while so that the whole of them together comfortably exceeds whatever cap the extractor applies to its output.</p>`
  ).join("");
  const html = extractReadable(page(long), BASE);
  assert.ok(html);
  const text = html.replace(/<[^>]+>/g, "");
  assert.ok(text.length < 6000, `capped, got ${text.length}`);
  assert.ok(text.length > 1000, `but not empty, got ${text.length}`);
  /* Cut between paragraphs, so the last one printed is whole */
  assert.match(html, /<\/p>$/);
});

test("prose wrapped several containers deep is still found", () => {
  const deep = Array.from(
    { length: 12 },
    (_, i) =>
      `<div class="block"><div class="inner"><div class="text"><p>Paragraph number ${i}, long enough to count as prose rather than as a caption or a stray line of chrome.</p></div></div></div>`
  ).join("");
  const html = extractReadable(page(deep), BASE);
  assert.ok(html, "an extract was produced");
  const paragraphs = (html.match(/<p>/g) || []).length;
  assert.ok(paragraphs >= 10, `kept most of them, got ${paragraphs}`);
});

test("one enormous block is not the extract", () => {
  const dump = "x".repeat(40000);
  assert.equal(extractReadable(page(`<pre>${dump}</pre>`), BASE), null);
  const withProse = extractReadable(page(`${prose}<pre>${dump}</pre>`), BASE);
  assert.ok(withProse);
  assert.ok(
    withProse.replace(/<[^>]*?>/gs, "").length < 6000,
    "the dump did not ride along"
  );
});

test("a long opening block is kept rather than dropped", () => {
  const long = `<p>${"A sentence that runs on and on. ".repeat(160)}</p>`;
  const html = extractReadable(page(long), BASE);
  assert.ok(html, "the page still has an extract");
  assert.match(html, /A sentence that runs on/);
});

test("headings and lists inside the body are kept", () => {
  const html = extractReadable(
    page(
      `${prose}<h2>A heading</h2><ul><li>A point worth making here</li></ul>`
    ),
    BASE
  );
  assert.ok(html);
  assert.match(html, /<h2>A heading<\/h2>/);
  assert.match(html, /A point worth making here/);
});
