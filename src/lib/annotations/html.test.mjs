import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

import * as text from "./text.ts";

// Node needs the bundler's extensionless text import resolved explicitly.
const { outputText } = ts.transpileModule(
  readFileSync(new URL("./html.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }
);
const require = createRequire(import.meta.url);
const html = { exports: {} };
new Function("require", "module", "exports", outputText)(
  (specifier) => (specifier === "./text" ? text : require(specifier)),
  html,
  html.exports
);
const { parseHtmlMeta } = html.exports;
const { cutWords, decodeEntities } = text;

test("open graph outranks the plain tags, and the title tag stands in", () => {
  const markup = `<!doctype html><html><head>
    <title>Fallback &amp; Title</title>
    <meta name="description" content="Plain description">
    <meta property="og:title" content="Graph &quot;Title&quot;" />
    <meta content='Graph description' property='og:description'>
    <meta property="og:site_name" content="The Site">
    <meta property="og:image" content="https://example.com/card.png">
  </head><body><meta property="og:title" content="not this one"></body></html>`;
  assert.deepEqual(parseHtmlMeta(markup), {
    title: 'Graph "Title"',
    description: "Graph description",
    siteName: "The Site",
    image: "https://example.com/card.png",
  });
});

test("a head with only a title still names the page", () => {
  assert.deepEqual(
    parseHtmlMeta("<html><head><title>\n  Only\n  a title </title></head>"),
    {
      title: "Only a title",
      description: undefined,
      siteName: undefined,
      image: undefined,
    }
  );
  assert.deepEqual(parseHtmlMeta("<html><head></head></html>"), {
    title: undefined,
    description: undefined,
    siteName: undefined,
    image: undefined,
  });
});

test("a picture is only kept when the web serves it", () => {
  assert.equal(
    parseHtmlMeta('<meta property="og:image" content="/relative.png">').image,
    undefined
  );
  assert.equal(
    parseHtmlMeta(
      '<meta property="og:image" content="data:image/png;base64,AA">'
    ).image,
    undefined
  );
});

test("entities decode, named and numeric, and the rest stay as written", () => {
  assert.equal(
    decodeEntities("a &amp; b &lt;c&gt; &#39;d&#x27; &nbsp;e &unknown;"),
    "a & b <c> 'd'  e &unknown;"
  );
});

test("the word cut keeps the budget and reports the remainder", () => {
  assert.deepEqual(cutWords("  one   two\nthree ", 2), {
    text: "one two",
    truncated: true,
  });
  assert.deepEqual(cutWords("one two", 2), {
    text: "one two",
    truncated: false,
  });
  assert.deepEqual(cutWords("", 5), { text: "", truncated: false });
});
