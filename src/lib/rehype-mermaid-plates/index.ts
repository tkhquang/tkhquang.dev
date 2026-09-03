import { Element, ElementContent, Root } from "hast";
import { toHtml } from "hast-util-to-html";
import { Transformer } from "unified";
import { visit } from "unist-util-visit";

/*
 * Chart Plates: the two bookends around rehype-mermaid that turn the
 * corpus's Dracula terminal screenshots into Lamplight plates rendered
 * at press time.
 *
 * Mermaid's classDef grammar rejects var(), so the source keeps its
 * hexes through rendering and the restore pass re-inks the FINISHED svg:
 * the Dracula values in its stylesheet and paint attributes become
 * var(--diagram-*) references, so the baked plates follow the page theme
 * at view time with no client mermaid at all. Restore also wraps each
 * svg back into <pre class="(original classes)" data-processed="true">,
 * so every shipped selector keeps working against the same DOM shape.
 */

/* The corpus's classDefs are perfectly uniform:
   fill:#282a36, stroke:<accent>, stroke-width:2px, color:<accent> */
const INK_MAP: Array<[RegExp, string]> = [
  [/#ff5555/gi, "var(--diagram-vermilion)"],
  [/#50fa7b/gi, "var(--diagram-viridian)"],
  [/#8be9fd/gi, "var(--diagram-lapis)"],
  [/#ffb86c/gi, "var(--diagram-gilt)"],
  [/#282a36/gi, "var(--diagram-node)"],
  [/#f8f8f2/gi, "var(--diagram-ink)"],
  /* The engraved line weight, per the approved demo */
  [/stroke-width:2px/gi, "stroke-width:1.1px"],
];

const CLASSES_KEY = "mermaidPlateClasses";

const isMermaidPre = (node: Element) =>
  node.tagName === "pre" &&
  Array.isArray(node.properties?.className) &&
  (node.properties.className as string[]).includes("mermaid");

const applyInkMap = (value: string) => {
  let out = value;
  for (const [pattern, replacement] of INK_MAP) {
    out = out.replace(pattern, replacement);
  }
  return out;
};

/* Re-ink a rendered svg subtree: its <style> text, inline style strings,
   and direct fill/stroke paint attributes */
function reinkSvg(node: Element) {
  for (const key of ["style", "fill", "stroke"] as const) {
    const value = node.properties?.[key];
    if (typeof value === "string") {
      node.properties[key] = applyInkMap(value);
    }
  }
  for (const child of node.children as ElementContent[]) {
    if (child.type === "text") {
      child.value = applyInkMap(child.value);
    } else if (child.type === "element") {
      reinkSvg(child);
    }
  }
}

/* The client renderer always read element.innerHTML and decoded the
   entities itself, which is why labels with <br/> worked. This is that
   exact reading, done to the hast tree: serialize the pre's children
   (surviving whatever the image plugins did to embedded tags), decode
   the way mermaid does, and hand the renderer one pristine text node.
   Without this, block elements the pipeline plants inside a diagram make
   the text extraction glue lines together and the parse fails. */
const innerSource = (node: Element) =>
  toHtml(node.children, { allowDangerousHtml: true })
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&");

export function rehypeMermaidPrepare(): Transformer<Root> {
  return (tree, file) => {
    const classLists: Array<string[]> = [];

    visit(tree, "element", (node: Element) => {
      if (!isMermaidPre(node)) return;
      classLists.push((node.properties.className as string[]).slice());
      node.children = [{ type: "text", value: innerSource(node) }];
    });

    (file.data as Record<string, unknown>)[CLASSES_KEY] = classLists;
  };
}

export function rehypeMermaidRestore(): Transformer<Root> {
  return (tree, file) => {
    const classLists =
      ((file.data as Record<string, unknown>)[CLASSES_KEY] as Array<
        string[]
      >) ?? [];

    visit(tree, "element", (node, index, parent) => {
      if (
        node.tagName !== "svg" ||
        typeof node.properties?.id !== "string" ||
        !node.properties.id.startsWith("mermaid-") ||
        parent == null ||
        typeof index !== "number"
      ) {
        return;
      }
      /* rehype-mermaid numbers output svgs in document order */
      const ordinal = Number(node.properties.id.slice("mermaid-".length));
      reinkSvg(node);
      const wrapper: Element = {
        type: "element",
        tagName: "pre",
        properties: {
          className: classLists[ordinal] ?? ["mermaid"],
          dataProcessed: "true",
        },
        children: [node],
      };
      parent.children[index] = wrapper;
    });
  };
}

/* Passed to rehype-mermaid: mono script measured with the real face (the
   css option loads it into the render browser), diagrams left on the
   base theme whose surfaces our stylesheet re-dresses */
export const MERMAID_RENDER_OPTIONS = {
  strategy: "inline-svg" as const,
  css: "https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;600&display=swap",
  mermaidConfig: {
    fontFamily: '"Source Code Pro", monospace',
    themeVariables: {
      fontFamily: '"Source Code Pro", monospace',
    },
  },
};
