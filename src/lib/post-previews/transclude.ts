import type { Element, ElementContent, Root, RootContent } from "hast";
import { toHtml } from "hast-util-to-html";
import { visit } from "unist-util-visit";
import "server-only";

const HEADINGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

const isHeading = (node: RootContent): node is Element =>
  node.type === "element" && HEADINGS.has(node.tagName);

const isBlank = (node: RootContent) =>
  node.type === "text" && node.value.trim() === "";

/* The blocks a card transcludes: the section under the named heading
   up to the next heading of any depth, or, unnamed, the opening blocks
   before the first heading. The notes plate at the foot is never part
   of a section. */
function pickBlocks(tree: Root, sectionId?: string): RootContent[] {
  const blocks = tree.children.filter(
    (node) =>
      !(
        node.type === "element" &&
        node.tagName === "section" &&
        "dataFootnotes" in node.properties
      )
  );
  const start = sectionId
    ? blocks.findIndex(
        (node) => isHeading(node) && node.properties.id === sectionId
      )
    : -1;
  if (sectionId && start === -1) return [];

  const picked: RootContent[] = [];
  for (const node of blocks.slice(start + 1)) {
    if (isHeading(node)) {
      if (!sectionId) break;
      /* A subsection is part of its section, so only a heading no
         deeper than the one linked ends the run */
      const level = Number(node.tagName[1]);
      const own = Number((blocks[start] as Element).tagName[1]);
      if (level <= own) break;
    }
    picked.push(node);
  }
  return picked;
}

/* A kicker line standing in for a plate the card cannot carry */
const omitted = (what: string): Element => ({
  type: "element",
  tagName: "p",
  properties: { className: ["kicker", "slip__omitted"] },
  children: [{ type: "text", value: `${what}: open the section to use it` }],
});

/**
 * Turns the article's finished tree back into plain markup the card can
 * print: the custom elements the page renders through React become the
 * elements they stand for, the interactive plates become a line saying
 * what was left out, and same-page links come to point at the page they
 * were written on. The page's own style block is not part of a section.
 */
function toPlainMarkup(nodes: RootContent[], pageHref: string): RootContent[] {
  const root: Root = { type: "root", children: structuredClone(nodes) };
  visit(root, "element", (node, index, parent) => {
    if (!parent || index === undefined) return;
    const replace = (replacement: ElementContent) => {
      parent.children[index] = replacement;
    };
    switch (node.tagName) {
      case "style":
        parent.children.splice(index, 1);
        return index;
      case "next-image": {
        const { src, alt, width, height } = node.properties;
        node.tagName = "img";
        node.properties = {
          src,
          alt,
          width,
          height,
          loading: "lazy",
          decoding: "async",
        };
        return;
      }
      case "mermaid-plate":
        node.tagName = "pre";
        return;
      case "rehype-pretty-copy-button-pre":
        node.tagName = "pre";
        delete node.properties.dataDuration;
        delete node.properties.dataVisibility;
        delete node.properties.dataCode;
        return;
      case "hex-diff":
        replace(omitted("An annotated hex diff"));
        return;
      case "camera-explorable":
        replace(omitted("A camera plate"));
        return;
      case "cross-reference":
        node.tagName = "a";
        delete node.properties.dataSlip;
        return;
      case "note-mark":
        /* The note's text stays on its own page; the card keeps the
           numeral as a plain mark */
        replace({
          type: "element",
          tagName: "sup",
          properties: { className: ["note-mark", "note-mark--print"] },
          children: [{ type: "text", value: String(node.properties.number) }],
        });
        return;
      case "a": {
        const href = node.properties.href;
        if (typeof href === "string" && href.startsWith("#")) {
          node.properties.href = `${pageHref}${href}`;
        }
        return;
      }
    }
  });
  return root.children;
}

/**
 * The markup a card transcludes from a post: the linked section, or the
 * opening blocks when the link names none, with the page's own address
 * behind every same-page link. Null when the section does not exist.
 */
export function getTransclusionHtml(
  tree: Root,
  pageHref: string,
  sectionId?: string
): string | null {
  const blocks = pickBlocks(tree, sectionId).filter((node) => !isBlank(node));
  if (blocks.length === 0) return null;
  return toHtml(toPlainMarkup(blocks, pageHref));
}
