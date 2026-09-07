import { sanitizeHtml } from "./sanitize";
import type { Element, Node, Parent, Root, RootContent } from "hast";
import { fromHtml } from "hast-util-from-html";
import { toHtml } from "hast-util-to-html";

/* Enough of a page to answer why the reader was sent there, and no more
   than a card can hold without becoming the page itself */
const MAX_CHARS = 4000;

/* Below this the extract says nothing the page's own description does
   not say better, so the card falls back to that instead */
const MIN_CHARS = 220;

/* A paragraph shorter than this is furniture, not prose, and scoring on
   it would hand the page to its own navigation */
const MIN_PARAGRAPH = 25;

/* Whole subtrees that are never the thing the reader came for */
const FURNITURE = new Set([
  "script",
  "style",
  "noscript",
  "template",
  "nav",
  "header",
  "footer",
  "aside",
  "form",
  "iframe",
  "svg",
  "canvas",
  "video",
  "audio",
  "button",
  "select",
  "input",
  "textarea",
  "label",
  "link",
  "meta",
  "dialog",
]);

/* What a card is willing to print. Everything else is unwrapped to its
   children, so a page that builds its prose out of nested containers
   keeps the prose and loses the containers. */
const KEEP = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "em",
  "strong",
  "b",
  "i",
  "a",
  "br",
  "figcaption",
  "dl",
  "dt",
  "dd",
  /* Kept whole rather than unwrapped. Unwrapped, a row's cells lose
     every boundary between them and the text reads as one long word. */
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
]);

/* A heading is short, and one wrapping anchor takes it to wholly link,
   which is the ordinary shape of a heading in most site templates */
const HEADINGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

/* The names a page gives the part worth reading, and the names it gives
   everything around it. Read off class and id, which is the only signal
   markup this varied reliably carries. */
const CONTENT_HINT =
  /(^|[\s_-])(article|content|entry|main|post|story|body|prose|markdown)([\s_-]|$)/i;
const CHROME_HINT =
  /(^|[\s_-])(comment|meta|footer|footnote|sidebar|nav|menu|promo|banner|cookie|consent|share|social|related|advert|ad|subscribe|newsletter|breadcrumb|pagination|widget|references?|citation|bibliography|biblio|toc|infobox)([\s_-]|$)/i;

/* Never a candidate for the body, however well they score */
const LISTS = new Set(["li", "ol", "ul", "dl", "dd", "dt"]);

const isElement = (node: Node): node is Element => node.type === "element";

const hint = (node: Element): string => {
  const { className, id } = node.properties ?? {};
  const classes = Array.isArray(className) ? className.join(" ") : className;
  return `${classes ?? ""} ${id ?? ""}`;
};

/* Every character of text under a node, which is what the reader would
   actually see if the node were printed */
function textOf(node: Node): string {
  if (node.type === "text") return (node as unknown as { value: string }).value;
  const children = (node as Parent).children;
  if (!children) return "";
  return children.map(textOf).join("");
}

/* How much of a node is link rather than prose. A list of links scores
   as well as an essay on length alone, and this is what tells them
   apart. */
function linkDensity(node: Element): number {
  const total = textOf(node).trim().length;
  if (!total) return 1;
  let linked = 0;
  const walk = (current: Node) => {
    if (isElement(current) && current.tagName === "a") {
      linked += textOf(current).trim().length;
      return;
    }
    for (const child of (current as Parent).children ?? []) walk(child);
  };
  walk(node);
  return Math.min(1, linked / total);
}

/* Drops the furniture in place, so scoring never sees it */
function prune(node: Parent): void {
  node.children = node.children.filter((child) => {
    if (!isElement(child)) return true;
    if (FURNITURE.has(child.tagName)) return false;
    prune(child);
    return true;
  }) as RootContent[];
}

/**
 * The element most likely to hold the page's own words, scored the way
 * a reader skims: paragraphs are worth something, their container is
 * worth what they hold, and a container that is mostly links is worth
 * nothing whatever its length. The scores climb one and two levels up
 * rather than only to the immediate parent, because prose is as often
 * wrapped twice as once.
 */
function findBody(root: Root): Element | null {
  const scores = new Map<Element, number>();
  const add = (node: Element | undefined, points: number) => {
    if (!node) return;
    scores.set(node, (scores.get(node) ?? 0) + points);
  };

  const parents: Element[] = [];
  const walk = (node: Parent) => {
    for (const child of node.children) {
      if (!isElement(child)) continue;
      const text = textOf(child).trim();
      /* Deliberately not li. A list item is as often a citation, a menu
         entry or a see-also as it is prose, and counting it hands the
         page to its own reference section, which is long, and which a
         reader following a link has not come for. */
      if (
        ["p", "pre", "blockquote", "dd"].includes(child.tagName) &&
        text.length >= MIN_PARAGRAPH
      ) {
        /* Longer prose counts for more, with a ceiling so one enormous
           block cannot carry a container on its own */
        const points = 1 + Math.min(3, Math.floor(text.length / 100));
        /* Credited all the way up, halving at each step. Crediting only
           a parent and a grandparent finds nothing on markup that wraps
           every block in a component of its own, because no two
           paragraphs then share an ancestor near enough to be scored,
           and the winner is whichever wrapper holds a single paragraph.
           Halving keeps the nearest shared ancestor ahead of the body
           element, which holds everything and means nothing. */
        let share = points;
        for (let up = parents.length - 1; up >= 0 && share >= 0.05; up--) {
          add(parents[up], share);
          share /= 2;
        }
      }
      parents.push(child);
      walk(child);
      parents.pop();
    }
  };
  walk(root);

  let best: Element | null = null;
  let bestScore = 0;
  /* Insertion order is document order, and a near tie goes to whichever
     came first, because a page puts what it is about above what it cites */
  for (const [node, base] of scores) {
    /* A list and its items are never the body of a page. They hold
       prose often enough to score well, and a footnote list scores
       best of all, being long and made of paragraphs. */
    if (LISTS.has(node.tagName)) continue;
    const name = hint(node);
    let score = base;
    if (node.tagName === "article" || node.tagName === "main") score += 10;
    if (CONTENT_HINT.test(name)) score += 8;
    if (CHROME_HINT.test(name)) score -= 12;
    score *= 1 - linkDensity(node);
    if (score > bestScore * 1.05) {
      bestScore = score;
      best = node;
    }
  }
  return best;
}

/* The winner reduced to what a card prints: anything not on the keep
   list gives way to its own children, and a block that is mostly links
   goes entirely, which is how a nested menu inside the article leaves */
function reduce(nodes: RootContent[]): RootContent[] {
  const out: RootContent[] = [];
  for (const node of nodes) {
    if (node.type === "text") {
      out.push(node);
      continue;
    }
    if (!isElement(node)) continue;
    const children = reduce(node.children as RootContent[]);
    if (!KEEP.has(node.tagName)) {
      out.push(...children);
      continue;
    }
    if (
      node.tagName !== "br" &&
      !textOf({ ...node, children } as Node).trim()
    ) {
      continue;
    }
    if (
      linkDensity(node) > 0.6 &&
      node.tagName !== "a" &&
      !HEADINGS.has(node.tagName)
    ) {
      continue;
    }
    out.push({ ...node, children } as RootContent);
  }
  return out;
}

/* As much of the reduced body as the cap allows, cut between blocks so
   the extract never ends mid-sentence. A single block longer than the
   whole budget is dropped rather than printed: a page whose opening is
   a log dump or a full code listing would otherwise put all of it in
   the card and in the record, the cap notwithstanding. */
function cap(nodes: RootContent[]): RootContent[] {
  const out: RootContent[] = [];
  let length = 0;
  for (const node of nodes) {
    const text = textOf(node).trim();
    if (!text && node.type === "text") continue;
    const room = MAX_CHARS - length;
    if (text.length > room) {
      /* A block is kept or dropped whole, never split, so one that will
         not fit ends the extract. When it is the first, dropping it
         would leave nothing at all, and a page whose opening paragraph
         simply runs long is a page worth quoting: it is kept, up to a
         ceiling that a log dump or a whole code listing clears easily
         and an essay does not. */
      if (out.length === 0 && text.length <= MAX_CHARS * 2) {
        out.push(node);
      }
      break;
    }
    out.push(node);
    length += text.length;
    if (length >= MAX_CHARS) break;
  }
  return out;
}

/**
 * The page's own words, kept so the card can stand in for the page.
 * This is the copy the site holds: a screenshot photographs whatever a
 * headless browser is shown, which in practice is a consent notice, and
 * a live frame is not a copy at all but the destination itself, running
 * its own scripts in the reader's browser and going when it goes. Text
 * is the thing that survives, reads on a phone, answers a search inside
 * the page, and can be spoken aloud.
 *
 * Null when the page yields too little to be worth printing, in which
 * case the card falls back to what the page says about itself.
 */
export function extractReadable(html: string, base: string): string | null {
  let root: Root;
  try {
    /* Two copies of the hast types are installed, and the parser is
       typed against the other one */
    root = fromHtml(html, { fragment: false }) as unknown as Root;
  } catch {
    return null;
  }
  prune(root);
  const body = findBody(root);
  if (!body) return null;

  const kept = cap(reduce(body.children as RootContent[]));
  const text = kept
    .map((node) => textOf(node).trim())
    .join(" ")
    .trim();
  if (text.length < MIN_CHARS) return null;

  return sanitizeHtml(toHtml({ type: "root", children: kept } as Root), base, {
    strip: ["id", "className"],
  });
}
