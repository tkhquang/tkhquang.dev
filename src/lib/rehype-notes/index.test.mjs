import assert from "node:assert/strict";
import test from "node:test";
import { toString as hastToString } from "hast-util-to-string";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import rehypeNotes from "./index.ts";

/* The site's plugin order up to this point: gfm after remark-rehype,
   and raw HTML parsed before the notes run. */
const toTree = (markdown) => {
  const processor = unified()
    .use(remarkParse, { fragment: true })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(remarkGfm)
    .use(rehypeRaw)
    .use(rehypeNotes);
  return processor.runSync(processor.parse(markdown));
};

const find = (tree, tagName) => {
  const found = [];
  visit(tree, "element", (node) => {
    if (node.tagName === tagName) found.push(node);
  });
  return found;
};

const sample = `Alpha[^one] then beta[^two] then alpha again[^one] and a stray[^ghost].

[^one]: The first note, with \`code\` and <a href="/blog/posts/x">a link</a>.
[^two]: A note of two paragraphs.

    The second paragraph.
`;

test("every reference becomes a note-mark carrying its own copy of the note", () => {
  const tree = toTree(sample);
  const marks = find(tree, "note-mark");
  assert.equal(marks.length, 3);

  const [first, second, again] = marks;
  assert.deepEqual(first.properties, {
    number: "1",
    id: "user-content-fnref-one",
    note: "user-content-fn-one",
  });
  assert.deepEqual(second.properties, {
    number: "2",
    id: "user-content-fnref-two",
    note: "user-content-fn-two",
  });
  assert.deepEqual(again.properties, {
    number: "1",
    id: "user-content-fnref-one-2",
    note: "user-content-fn-one",
  });

  assert.equal(hastToString(first), "The first note, with code and a link.");
  assert.equal(find(first, "a").length, 1);
  assert.equal(find(first, "code").length, 1);
  assert.equal(find(first, "p").length, 0);
});

test("a definition referenced twice yields two independent copies", () => {
  const tree = toTree(sample);
  const [first, , again] = find(tree, "note-mark");
  first.children.push({ type: "text", value: " mutated" });
  assert.equal(hastToString(again), "The first note, with code and a link.");
});

test("a note of several paragraphs keeps its blocks", () => {
  const tree = toTree(sample);
  const second = find(tree, "note-mark")[1];
  assert.equal(find(second, "p").length, 2);
  assert.equal(find(second, "a").length, 0);
  assert.equal(
    hastToString(second).replace(/\s+/g, " ").trim(),
    "A note of two paragraphs. The second paragraph."
  );
});

test("no reference mark survives as a superscript, and an undefined key stays text", () => {
  const tree = toTree(sample);
  /* The only superscript left is the plate's own "2" on the second
     back-reference arrow */
  const refs = find(tree, "sup").filter((node) =>
    node.children.some(
      (child) =>
        child.type === "element" &&
        child.tagName === "a" &&
        "dataFootnoteRef" in child.properties
    )
  );
  assert.equal(refs.length, 0);
  assert.ok(hastToString(tree).includes("a stray[^ghost]"));
});

test("the plate is dressed and keeps its rows, arrows and label id", () => {
  const tree = toTree(sample);
  const [plate] = find(tree, "section");
  assert.ok(plate.properties.className.includes("notes-plate"));

  /* A labelled region, not a heading: nothing here may reach the TOC */
  assert.equal(find(plate, "h2").length, 0);
  const head = find(plate, "p").find(
    (node) => node.properties.id === "footnote-label"
  );
  assert.ok(head);
  assert.deepEqual(head.properties.className, ["kicker", "notes-plate__head"]);
  assert.equal(hastToString(head), "Notes");
  assert.equal(plate.properties.ariaLabelledBy, "footnote-label");

  const [rows] = find(plate, "ol");
  assert.ok(rows.properties.className.includes("notes-plate__rows"));
  /* WebKit stops announcing a list once the marker goes. */
  assert.equal(rows.properties.role, "list");
  const items = find(plate, "li");
  assert.equal(items.length, 2);
  for (const item of items) {
    assert.ok(item.properties.className.includes("notes-plate__row"));
  }

  const backrefs = find(plate, "a").filter((node) =>
    node.properties.className?.includes("notes-plate__backref")
  );
  assert.equal(backrefs.length, 3);
  assert.equal(backrefs[0].properties.href, "#user-content-fnref-one");
});

test("a note that cites another note carries that note's mark, and never itself", () => {
  const tree = toTree(
    "Outer[^a].\n\n[^a]: Says inner[^b] and again[^a].\n[^b]: Inner text.\n"
  );
  const outer = find(tree, "note-mark").find(
    (node) => node.properties.note === "user-content-fn-a"
  );
  assert.ok(outer);
  const nested = find(outer, "note-mark").filter((node) => node !== outer);
  assert.equal(nested.length, 1);
  assert.equal(nested[0].properties.note, "user-content-fn-b");
  assert.equal(hastToString(nested[0]), "Inner text.");
  /* The self-citation stays remark's link rather than recursing. */
  assert.equal(find(outer, "sup").length, 1);
});

test("a note whose last block is not a paragraph keeps its blocks and loses its arrows", () => {
  const tree = toTree(
    `A[^l].\n\n[^l]: Two entries follow.\n\n    - one\n    - two\n`
  );
  const [mark] = find(tree, "note-mark");
  assert.equal(find(mark, "p").length, 1);
  assert.equal(find(mark, "li").length, 2);
  /* remark seats the arrow in the last block, whatever that block is. */
  const arrows = find(mark, "a").filter(
    (node) => "dataFootnoteBackref" in node.properties
  );
  assert.equal(arrows.length, 0);
});

test("a document without notes is left alone", () => {
  const tree = toTree("Just prose with a <sup>1</sup> of its own.");
  assert.equal(find(tree, "note-mark").length, 0);
  assert.equal(find(tree, "sup").length, 1);
});
