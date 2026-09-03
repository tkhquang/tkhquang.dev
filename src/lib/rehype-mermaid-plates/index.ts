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

/* Mermaid 11.6 hard-caps subgraph titles at 200px, wrapping them onto
   the nodes beneath (the config wrappingWidth only reaches node labels).
   Repair on the finished svg: one line, sized to the text, recentered. */
const collectText = (node: Element): string => {
  let out = "";
  for (const child of node.children as ElementContent[]) {
    if (child.type === "text") out += child.value;
    else if (child.type === "element") out += collectText(child);
  }
  return out;
};

function unwrapClusterLabels(node: Element) {
  const isClusterLabel =
    Array.isArray(node.properties?.className) &&
    (node.properties.className as string[]).includes("cluster-label");

  if (isClusterLabel) {
    const foreign = node.children.find(
      (child): child is Element =>
        child.type === "element" && child.tagName === "foreignObject"
    );
    if (foreign) {
      const text = collectText(foreign).trim();
      const oldWidth = Number(foreign.properties?.width) || 200;
      /* Mono at the cluster-title size runs about 10px per glyph */
      const width = Math.ceil(text.length * 10.2 + 16);
      if (width > oldWidth) {
        foreign.properties.width = width;
        foreign.properties.height = 24;
        const div = foreign.children.find(
          (child): child is Element =>
            child.type === "element" && child.tagName === "div"
        );
        if (div && typeof div.properties?.style === "string") {
          div.properties.style = div.properties.style
            .replace(/max-width:\s*[^;]+;?/, "")
            .replace(/width:\s*[^;]+;?/, "")
            .concat(";white-space:nowrap;width:max-content");
        }
        const transform = node.properties?.transform;
        if (typeof transform === "string") {
          const match = transform.match(
            /translate\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/
          );
          if (match) {
            const x = Number(match[1]) - (width - oldWidth) / 2;
            node.properties.transform = `translate(${x}, ${match[2]})`;
          }
        }
      }
    }
  }

  for (const child of node.children as ElementContent[]) {
    if (child.type === "element") unwrapClusterLabels(child);
  }
}

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
   the text extraction glue lines together and the parse fails. Numeric
   references matter: toHtml writes an ampersand as &#x26;, and skipping
   those printed "&#x26;" literally into diagram labels. */
const innerSource = (node: Element) =>
  toHtml(node.children, { allowDangerousHtml: true })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&quot;/g, '"')
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
      unwrapClusterLabels(node);
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

/* Passed to rehype-mermaid. Measured in headless chromium's monospace,
   whose advance width matches Source Code Pro closely enough that the
   displayed face fits the measured boxes (a remote font css provably
   never reaches measurement, so none is loaded). Diagrams render at
   NATURAL size: useMaxWidth downscaling was what made wide charts
   unreadably small; the pre scrolls instead. wrappingWidth lifts the
   200px label cap that wrapped and collided subgraph titles, and
   subGraphTitleMargin reserves real space beneath them. */
export const MERMAID_RENDER_OPTIONS = {
  strategy: "inline-svg" as const,
  mermaidConfig: {
    fontFamily: '"Source Code Pro", monospace',
    themeVariables: {
      fontFamily: '"Source Code Pro", monospace',
    },
    flowchart: {
      useMaxWidth: false,
      wrappingWidth: 800,
      subGraphTitleMargin: { top: 8, bottom: 16 },
    },
    sequence: {
      useMaxWidth: false,
    },
  },
};
