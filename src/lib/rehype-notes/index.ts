import type { Element, ElementContent, Root, RootContent } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import type { Transformer } from "unified";
import { EXIT, visit } from "unist-util-visit";

/* hast camel-cases data attributes. Match dataFootnoteRef here, not
   the data-footnote-ref that reaches the HTML. */
const isBackref = (node: ElementContent) =>
  node.type === "element" &&
  node.tagName === "a" &&
  "dataFootnoteBackref" in node.properties;

const isReference = (node: ElementContent): node is Element =>
  node.type === "element" &&
  node.tagName === "a" &&
  "dataFootnoteRef" in node.properties;

const addClass = (node: Element, name: string) => {
  const current = node.properties.className;
  const existing = Array.isArray(current)
    ? current.map(String)
    : typeof current === "string"
      ? [current]
      : [];
  node.properties.className = [...existing, name];
};

/* An arrow links back to the mark, so a copy of the note has no use for
   one. remark puts a space before each arrow, so trim what the removal
   leaves behind. */
function stripBackrefs(nodes: ElementContent[]): void {
  const kept = nodes.filter((node) => !isBackref(node));
  if (kept.length !== nodes.length) {
    while (kept.length > 0) {
      const tail = kept[kept.length - 1];
      if (tail.type !== "text") break;
      tail.value = tail.value.trimEnd();
      if (tail.value) break;
      kept.pop();
    }
  }
  nodes.splice(0, nodes.length, ...kept);
  for (const node of kept) {
    if (node.type === "element") stripBackrefs(node.children);
  }
}

/* The slip body is already a block. A lone paragraph inside it only
   adds margins, so unwrap it. Keep several blocks as they are. */
function getNoteBody(item: Element): ElementContent[] {
  const body = structuredClone(item.children);
  stripBackrefs(body);
  const blocks = body.filter(
    (node) => !(node.type === "text" && node.value.trim() === "")
  );
  const only = blocks.length === 1 ? blocks[0] : undefined;
  if (only?.type === "element" && only.tagName === "p") {
    return only.children;
  }
  return body;
}

function findPlate(tree: Root): Element | undefined {
  let plate: Element | undefined;
  visit(tree, "element", (node) => {
    if (node.tagName === "section" && "dataFootnotes" in node.properties) {
      plate = node;
      return EXIT;
    }
  });
  return plate;
}

/* Replace the references inside a copy as well. A note that cites
   another note would otherwise show a jump link, which a reader cannot
   follow from a slip. The opened set stops a note that cites itself. */
function makeMark(
  anchor: Element,
  bodies: Map<string, ElementContent[]>,
  opened: Set<string>
): Element | undefined {
  const href = anchor.properties.href;
  if (typeof href !== "string" || !href.startsWith("#")) return undefined;
  const noteId = href.slice(1);
  const body = bodies.get(noteId);
  if (!body || opened.has(noteId)) return undefined;

  const children = structuredClone(body);
  replaceMarks(children, bodies, new Set([...opened, noteId]));
  return {
    type: "element",
    tagName: "note-mark",
    properties: {
      number: hastToString(anchor),
      id: anchor.properties.id,
      note: noteId,
    },
    children,
  };
}

function replaceMarks(
  nodes: RootContent[],
  bodies: Map<string, ElementContent[]>,
  opened: Set<string>
): void {
  nodes.forEach((node, index) => {
    if (node.type !== "element") return;
    const [only] = node.children;
    if (
      node.tagName === "sup" &&
      node.children.length === 1 &&
      isReference(only)
    ) {
      const mark = makeMark(only, bodies, opened);
      /* No definition, nothing to show: leave remark's link. */
      if (mark) nodes[index] = mark;
      return;
    }
    replaceMarks(node.children, bodies, opened);
  });
}

/**
 * GFM footnotes become note marks that carry their own text.
 *
 * Each mark holds its own copy of the note, so the client opens a slip
 * without a second lookup. A note referenced twice is copied twice,
 * because the two marks open two independent slips.
 *
 * remark's endnote section stays and becomes the Notes plate. Without
 * script, the marks are links to it.
 */
export default function rehypeNotes(): Transformer<Root> {
  return (tree) => {
    const plate = findPlate(tree);
    if (!plate) return;

    const bodies = new Map<string, ElementContent[]>();
    visit(plate, "element", (node) => {
      if (node.tagName !== "li" || typeof node.properties.id !== "string") {
        return;
      }
      bodies.set(node.properties.id, getNoteBody(node));
    });

    replaceMarks(tree.children, bodies, new Set());

    addClass(plate, "notes-plate");
    for (const child of plate.children) {
      if (child.type !== "element") continue;
      if (child.tagName === "h2") {
        /* A heading here would enter the table of contents and take an
           autolink. Use a paragraph, and name the section with its id. */
        child.tagName = "p";
        child.properties.className = ["kicker", "notes-plate__head"];
        child.children = [{ type: "text", value: "Notes" }];
        plate.properties.ariaLabelledBy = child.properties.id;
      }
      if (child.tagName === "ol") {
        addClass(child, "notes-plate__rows");
        /* The rows print their own numerals, so the marker goes. WebKit
           then stops announcing a list unless the role says so. */
        child.properties.role = "list";
        for (const item of child.children) {
          if (item.type !== "element" || item.tagName !== "li") continue;
          addClass(item, "notes-plate__row");
          visit(item, "element", (node) => {
            if (isBackref(node)) addClass(node, "notes-plate__backref");
          });
        }
      }
    }
  };
}
