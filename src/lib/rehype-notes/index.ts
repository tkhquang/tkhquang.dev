import type { Element, ElementContent, Root, RootContent } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import type { Transformer } from "unified";
import { EXIT, visit } from "unist-util-visit";

/* remark's footnote hooks, as hast names its data attributes */
const isBackref = (node: ElementContent) =>
  node.type === "element" &&
  node.tagName === "a" &&
  "dataFootnoteBackref" in node.properties;

const isReference = (node: ElementContent): node is Element =>
  node.type === "element" &&
  node.tagName === "a" &&
  "dataFootnoteRef" in node.properties;

const addClass = (node: Element, ...names: string[]) => {
  const current = node.properties.className;
  const existing = Array.isArray(current)
    ? current.map(String)
    : typeof current === "string"
      ? [current]
      : [];
  node.properties.className = [...existing, ...names];
};

/* The back-reference arrows point at the marks and mean nothing inside a
   slip, so they come out of the copy. remark seats them at the tail of
   the note's last paragraph behind a single space, and separates a
   second arrow from the first with another, so the trailing text is
   trimmed once the arrows are gone. */
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

/* A note that is one paragraph unwraps to its inline content: the slip
   body is a block of its own, and a paragraph inside it would only add
   the paragraph's margins. A note of several blocks keeps them. */
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

/* The mark for one reference: the numeral, the ids, and its own copy of
   the note. A note that cites another note gets that note's mark inside
   its copy too, so the slip never shows remark's bare jump link; the
   chain of ids already opened guards a note that cites itself. */
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
      only &&
      isReference(only)
    ) {
      const mark = makeMark(only, bodies, opened);
      /* A reference without a definition stays remark's plain link */
      if (mark) nodes[index] = mark;
      return;
    }
    replaceMarks(node.children, bodies, opened);
  });
}

/**
 * Notes: GFM footnotes become note marks that carry their own text.
 *
 * remark renders `[^key]` as a superscript link to an endnote and the
 * definitions as a section at the foot of the article. Both stay. The
 * section becomes the Notes plate, the printed record of every note and
 * the target the marks jump to when no script runs. Each mark becomes a
 * `note-mark` element holding a copy of its note, so the client can open
 * the note in a slip beside the marker without a second lookup, and a
 * definition referenced twice is copied twice, because the two marks
 * render as two independent slips.
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
        /* The screen-reader-only "Footnotes" heading becomes the plate's
           printed head, as a labelled region rather than a heading: the
           plate is furniture, not a chapter, so it must not join the
           table of contents or take the autolink every heading gets.
           The id stays, and the section takes it as its name. */
        child.tagName = "p";
        child.properties.className = ["kicker", "notes-plate__head"];
        child.children = [{ type: "text", value: "Notes" }];
        plate.properties.ariaLabelledBy = child.properties.id;
      }
      if (child.tagName === "ol") {
        addClass(child, "notes-plate__rows");
        /* The rows print their own numerals and lose the list marker,
           which is where WebKit stops announcing a list without this */
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
