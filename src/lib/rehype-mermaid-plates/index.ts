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

/* The corpus classed every pre "mermaid flex justify-center". The layout
   pair belonged to the old client renderer: on a baked svg, flex shrinks
   the box to the column while the height attribute stands, scaling the
   drawing down inside a full-height void. The plate CSS owns layout now,
   so only the identity class survives the round trip. */
const LEGACY_LAYOUT_CLASSES = new Set(["flex", "justify-center"]);

const CLASSES_KEY = "mermaidPlateClasses";
const TITLES_KEY = "mermaidPlateTitles";

/* Subgraph titles, read straight from each diagram's source. The
   unwrap pass needs them because mermaid's wrapped tspans do not say
   whether a line break fell between words or inside one. */
const sourceClusterTitles = (source: string): string[] => {
  const titles: string[] = [];
  for (const match of source.matchAll(
    /^\s*subgraph\s+(?:[\w-]+\s*)?\[?"([^"\]]+)"\]?/gm
  )) {
    titles.push(match[1]);
  }
  return titles;
};

/* Labels are measured in the render browser at this metric: 16px Courier
   New advances 0.6em per glyph, the same as the Source Code Pro the page
   displays. Estimates from it are exact for mono text. */
const GLYPH_ADVANCE = 16 * 0.6;

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

const hasClass = (node: Element, name: string) =>
  Array.isArray(node.properties?.className) &&
  (node.properties.className as string[]).includes(name);

const collectText = (node: Element): string => {
  let out = "";
  for (const child of node.children as ElementContent[]) {
    if (child.type === "text") out += child.value;
    else if (child.type === "element") out += collectText(child);
  }
  return out;
};

const findElement = (
  node: Element,
  match: (el: Element) => boolean
): Element | undefined => {
  for (const child of node.children as ElementContent[]) {
    if (child.type !== "element") continue;
    if (match(child)) return child;
    const found = findElement(child, match);
    if (found) return found;
  }
  return undefined;
};

/* Mermaid 11.6 hard-caps subgraph titles at 200px and wraps them into
   stacked tspan lines the layout never reserved room for, so they run
   into the nodes beneath (wrappingWidth only reaches node labels).
   Repair on the finished svg: merge the lines back into one, and shift
   the label group so the longer line stays centered on the cluster. */
function unwrapClusterLabels(node: Element, titles: string[]) {
  if (hasClass(node, "cluster-label")) {
    const text = findElement(node, (el) => el.tagName === "text");
    const lines = text
      ? (text.children.filter(
          (child) =>
            child.type === "element" && hasClass(child, "text-outer-tspan")
        ) as Element[])
      : [];
    if (text && lines.length > 1) {
      const lineTexts = lines.map((line) => collectText(line).trim());
      /* A break that fell inside a word must not become a space, so the
         joined guess only stands until it matches a source title */
      const guess = lineTexts.join(" ");
      const merged =
        titles.find(
          (title) =>
            title.replace(/\s+/g, "") === guess.replace(/\s+/g, "")
        ) ?? guess;
      const oldWidth =
        Math.max(...lineTexts.map((line) => line.length)) * GLYPH_ADVANCE;
      const newWidth = merged.length * GLYPH_ADVANCE;
      const first = lines[0];
      first.children = [
        {
          ...(first.children.find(
            (child) => child.type === "element"
          ) as Element),
          children: [{ type: "text", value: merged }],
        },
      ];
      text.children = [first];
      const transform = node.properties?.transform;
      if (typeof transform === "string") {
        const match = transform.match(
          /translate\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/
        );
        if (match) {
          const x = Number(match[1]) - (newWidth - oldWidth) / 2;
          node.properties.transform = `translate(${x}, ${match[2]})`;
        }
      }
    }
  }

  for (const child of node.children as ElementContent[]) {
    if (child.type === "element") unwrapClusterLabels(child, titles);
  }
}

/* Flowchart node labels come back with their entities still encoded
   ("&amp;" printed literally into the plate); svg text needs none of
   that armor, so decode what the renderer left behind. Ordered so a
   double-encoded "&amp;lt;" resolves all the way to "<". */
const repairEntities = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

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
      child.value = repairEntities(applyInkMap(child.value));
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
    .replace(/&amp;/g, "&")
    /* The corpus decorates labels with FontAwesome tokens; no renderer
       here has ever loaded that stylesheet, so as svg text they print
       literally. Dropped before measurement. */
    .replace(/fa:fa-[a-z0-9-]+ ?/g, "")
    /* Mermaid's per-diagram frontmatter is anchored at the very first
       character; the pre's inner text opens with the newline after the
       tag, which would hide every --- block */
    .trim();

export function rehypeMermaidPrepare(): Transformer<Root> {
  return (tree, file) => {
    const classLists: Array<string[]> = [];
    const titleLists: Array<string[]> = [];

    visit(tree, "element", (node: Element) => {
      if (!isMermaidPre(node)) return;
      classLists.push((node.properties.className as string[]).slice());
      const source = innerSource(node);
      titleLists.push(sourceClusterTitles(source));
      node.children = [{ type: "text", value: source }];
    });

    (file.data as Record<string, unknown>)[CLASSES_KEY] = classLists;
    (file.data as Record<string, unknown>)[TITLES_KEY] = titleLists;
  };
}

export function rehypeMermaidRestore(): Transformer<Root> {
  return (tree, file) => {
    const classLists =
      ((file.data as Record<string, unknown>)[CLASSES_KEY] as Array<
        string[]
      >) ?? [];
    const titleLists =
      ((file.data as Record<string, unknown>)[TITLES_KEY] as Array<
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
      unwrapClusterLabels(node, titleLists[ordinal] ?? []);
      /* The sequence title's x is computed for a middle anchor, but the
         anchor itself never lands in this render path, so the text runs
         off the right edge of narrow charts */
      for (const child of node.children) {
        if (
          child.type === "element" &&
          child.tagName === "text" &&
          child.properties.textAnchor == null
        ) {
          child.properties.textAnchor = "middle";
        }
      }
      const wrapper: Element = {
        type: "element",
        tagName: "pre",
        properties: {
          className: (classLists[ordinal] ?? ["mermaid"]).filter(
            (name) => !LEGACY_LAYOUT_CLASSES.has(name)
          ),
          dataProcessed: "true",
        },
        children: [node],
      };
      parent.children[index] = wrapper;
    });
  };
}

/* Passed to rehype-mermaid.

   htmlLabels false (the root key is the one the v2 renderer honors) is
   what makes labels trustworthy: as foreignObject divs they are clipped
   boxes sized in the render browser and re-flowed by the article's
   prose CSS at view time, which cut glyphs off every node; as svg text
   the line breaks are baked into tspans and a metric mismatch can only
   overhang, never clip.

   Courier New is the measurement face because its 0.6em advance equals
   the displayed Source Code Pro exactly (the render browser has no SCP,
   and a stylesheet provably never reaches measurement); Linux builds
   fall back to Liberation/DejaVu mono at the same advance. The plate
   CSS re-fonts the finished svg for display.

   useMaxWidth would downscale wide charts into the column, which is
   what made their type unreadably small: charts keep natural size and
   the plate scrolls. wrappingWidth folds node labels so flowcharts stay
   near the column's width. */
export const MERMAID_RENDER_OPTIONS = {
  strategy: "inline-svg" as const,
  mermaidConfig: {
    fontFamily: '"Courier New", monospace',
    htmlLabels: false,
    themeVariables: {
      fontFamily: '"Courier New", monospace',
    },
    flowchart: {
      useMaxWidth: false,
      htmlLabels: false,
      wrappingWidth: 380,
      subGraphTitleMargin: { top: 8, bottom: 16 },
    },
    sequence: {
      useMaxWidth: false,
      /* The stock 150px actor minimum and 50px outer margins spend a
         third of the column before any message is drawn */
      width: 110,
      diagramMarginX: 8,
    },
  },
};
