import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import * as runtime from "react/jsx-runtime";
import rehypeRaw from "rehype-raw";
import rehypeReact from "rehype-react";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import ts from "typescript";
import { unified } from "unified";
import { parseDocument, stringify } from "yaml";

import rehypeHexDiff from "../../../lib/rehype-hex-diff/index.ts";
import * as inspection from "./inspection.ts";
import * as preparation from "./prepare.ts";

const require = createRequire(import.meta.url);

// Node has no CSS loader or server-component bundler. Resolve those boundaries
// explicitly while rendering the actual parser, adapter, and view together.
function loadModule(relativePath, dependencies) {
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(relativePath, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }
  );
  const loadedModule = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    (specifier) =>
      Object.hasOwn(dependencies, specifier)
        ? dependencies[specifier]
        : require(specifier),
    loadedModule,
    loadedModule.exports
  );
  return loadedModule.exports;
}

const parser = loadModule("./parse.ts", {
  "./prepare": preparation,
});
const view = loadModule("./HexDiffView.tsx", {
  "./HexDiff.css": {},
  "./inspection": inspection,
});
const { default: HexDiff } = loadModule("./HexDiff.tsx", {
  "./parse": parser,
  "./HexDiffView": view,
  "server-only": {},
});

const article = readFileSync(
  new URL(
    "../../../../content/posts/the-object-already-knows-its-own-name.md",
    import.meta.url
  ),
  "utf8"
);
const authoredFence = unified()
  .use(remarkParse)
  .parse(article)
  .children.find((node) => node.type === "code" && node.lang === "hex-diff");
assert.ok(authoredFence, "The article must contain its authored hex-diff fence.");
const source = authoredFence.value;

function fence(value) {
  return `\`\`\`hex-diff\n${value}\n\`\`\``;
}

function changedSource(change) {
  const example = parseDocument(source, { schema: "failsafe" }).toJS({
    maxAliasCount: 0,
  });
  change(example);
  return stringify(example);
}

async function render(markdown) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeHexDiff)
    .use(rehypeRaw)
    .use(rehypeReact, {
      ...runtime,
      components: { "hex-diff": HexDiff },
    })
    .process(markdown);
  return renderToStaticMarkup(file.result);
}

test("the article's fence renders its inline comparison without a code or paragraph wrapper", async () => {
  const html = await render(
    `Before.\n\n${fence(source)}\n\nAfter.\n\n## Following heading`
  );
  assert.match(html, /^<p>Before\.<\/p>\n<figure class="hex-diff"/);
  assert.match(html, /data-example="equip-hide-offset"/);
  assert.match(html, /48 8B 45 5F 0F B6 40 1C 3C 03/);
  assert.match(html, /48 8B 45 5F 0F B6 40 20 3C 03/);
  assert.match(html, /Encoding breakdown/);
  assert.match(
    html,
    /<\/figure>\n<p>After\.<\/p>\n<h2>Following heading<\/h2>$/
  );
  assert.doesNotMatch(html, /<pre>|<hex-diff/);
});

test("empty fences and invalid inline encodings fail during actual rendering", async () => {
  await assert.rejects(
    render(fence("")),
    /Hex diff YAML.*fence must contain an example/
  );
  const invalid = changedSource((example) => {
    example.pairs[1].after.fields[0].hex = "??";
  });
  await assert.rejects(
    render(fence(invalid)),
    /equip-hide-offset.*visibility-load.*after.*opcode.*invalid hex token/
  );
});

test("ordinary code fences retain their own language and byte text", async () => {
  const html = await render("```text\n48 8B 45 5F\n```");
  assert.equal(
    html,
    '<pre><code class="language-text">48 8B 45 5F\n</code></pre>'
  );
});

test("authored annotations stay escaped text through YAML, raw HTML parsing, and rendering", async () => {
  const annotation = '<script>alert("x")</script> & "quoted"';
  const annotated = changedSource((example) => {
    example.caption = annotation;
    example.notes = [annotation];
    example.pairs[1].before.fields[0].description = annotation;
  });
  const html = await render(fence(annotated));
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&amp;/);
});

test("repeated inline definitions render with distinct DOM IDs", async () => {
  const html = await render(`${fence(source)}\n\n${fence(source)}`);
  assert.equal((html.match(/<figure /g) ?? []).length, 2);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(ids.length > 2);
  assert.equal(new Set(ids).size, ids.length);
});

test("separate fences use their own definitions without a registry", async () => {
  const second = changedSource((example) => {
    example.id = "second-example";
    example.title = "Second inline comparison";
  });
  const html = await render(`${fence(source)}\n\n${fence(second)}`);
  assert.match(html, /data-example="equip-hide-offset"/);
  assert.match(html, /data-example="second-example"/);
  assert.match(html, /Second inline comparison/);
});

test("fences remain block content when placed directly after prose", async () => {
  const html = await render(`Before.\n${fence(source)}\nAfter.`);
  assert.match(html, /^<p>Before\.<\/p>\n<figure /);
  assert.match(html, /<\/figure>\n<p>After\.<\/p>$/);
});
