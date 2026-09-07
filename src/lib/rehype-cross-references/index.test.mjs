import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import rehypeRaw from "rehype-raw";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import ts from "typescript";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import * as annotations from "../annotations/parse.ts";
import * as previews from "../post-previews/parse.ts";
import * as keys from "../slips/key.ts";

// Node needs the bundler's extensionless imports resolved explicitly, and
// the site's availability check reaches the network, so the tests bring
// their own.
const { outputText } = ts.transpileModule(
  readFileSync(new URL("./index.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }
);
const require = createRequire(import.meta.url);
const plugin = { exports: {} };
const local = {
  "../post-previews/parse": previews,
  "../annotations/parse": annotations,
  "../slips/key": keys,
  "../slips/available": { hasSlipCard: async () => true },
};
new Function("require", "module", "exports", outputText)(
  (specifier) => local[specifier] ?? require(specifier),
  plugin,
  plugin.exports
);
const rehypeCrossReferences = plugin.exports.default;

const toTree = async (markdown, options) => {
  const processor = unified()
    .use(remarkParse, { fragment: true })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeCrossReferences, options);
  return processor.run(processor.parse(markdown));
};

const anchorsOf = (tree) => {
  const found = [];
  visit(tree, "element", (node) => {
    if (node.tagName === "a" || node.tagName === "cross-reference") {
      found.push(node);
    }
  });
  return found;
};

test("a raw anchor marked data-preview becomes a cross-reference, props intact, key attached", async () => {
  const tree = await toTree(
    'See <a href="/blog/posts/the-object#a-section" target="_blank" rel="noopener noreferrer" data-preview>the object</a>.'
  );
  const [node] = anchorsOf(tree);
  assert.equal(node.tagName, "cross-reference");
  assert.deepEqual(node.properties, {
    href: "/blog/posts/the-object#a-section",
    target: "_blank",
    rel: ["noopener", "noreferrer"],
    dataSlip: keys.getSlipKey("/blog/posts/the-object#a-section"),
    dataSlipName: "the object",
  });
  assert.equal(node.children[0].value, "the object");
});

test('a markdown link titled "preview" is renamed and loses the title', async () => {
  const tree = await toTree(
    'See [the object](/blog/posts/the-object "preview") and [a repo](https://github.com/tkhquang/DetourModKit "preview").'
  );
  for (const node of anchorsOf(tree)) {
    assert.equal(node.tagName, "cross-reference", node.properties.href);
    assert.equal(node.properties.title, undefined);
    assert.equal(typeof node.properties.dataSlip, "string");
  }
});

test("an unmarked link stays a plain link, whatever it points at", async () => {
  const tree = await toTree(
    [
      "[a post](/blog/posts/the-object)",
      "[a repo](https://github.com/tkhquang/DetourModKit)",
      '<a href="/blog/posts/x">raw</a>',
      '[titled](https://example.com "A real tooltip")',
    ].join(" ")
  );
  const nodes = anchorsOf(tree);
  assert.equal(nodes.length, 4);
  for (const node of nodes) {
    assert.equal(node.tagName, "a", node.properties.href);
  }
  assert.equal(nodes[3].properties.title, "A real tooltip");
});

test("a marked link nothing can serve stays a plain link, unmarked", async () => {
  const tree = await toTree(
    [
      '[a tag](/blog/tags/react "preview")',
      '[local](http://127.0.0.1:3000/blog "preview")',
      '<a href="mailto:someone@example.com" data-preview>mail</a>',
    ].join(" ")
  );
  const nodes = anchorsOf(tree);
  assert.equal(nodes.length, 3);
  for (const node of nodes) {
    assert.equal(node.tagName, "a", node.properties.href);
    assert.equal(node.properties.title, undefined);
    assert.equal("dataPreview" in node.properties, false);
  }
});

test("a marked link whose card cannot be served stays a plain link too", async () => {
  const tree = await toTree(
    '[gone](/blog/posts/gone "preview") and [there](/blog/posts/there "preview")',
    { hasSlipCard: async (href) => !href.includes("gone") }
  );
  const [gone, there] = anchorsOf(tree);
  assert.equal(gone.tagName, "a");
  assert.equal(gone.properties.title, undefined);
  assert.equal(there.tagName, "cross-reference");
});
