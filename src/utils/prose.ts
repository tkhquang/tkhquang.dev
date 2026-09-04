/**
 * Plain-text readings of a post's markdown body, computed at build for the
 * chapter-close colophon line and the catchword. Counting deliberately
 * excludes fenced code, raw HTML blocks (mermaid diagrams included), and
 * markdown syntax so a dense devlog does not inflate its reading time.
 */

const FENCE_PATTERN = /```[\s\S]*?```/g;
const RAW_BLOCK_PATTERN = /<pre[\s\S]*?<\/pre>|<script[\s\S]*?<\/script>/gi;
const HTML_TAG_PATTERN = /<[^>]+>/g;
const IMAGE_PATTERN = /!\[[^\]]*\]\([^)]*\)/g;
const LINK_PATTERN = /\[([^\]]*)\]\([^)]*\)/g;
const HEADING_MARK_PATTERN = /^#{1,6}\s+/gm;
const EMPHASIS_PATTERN = /[*_`~]/g;

/* Blocks have to be matched against the whole document: the closing
   delimiter is the only thing that says where one ends, so nothing that
   sees a single line at a time can recognise them. */
const stripBlocks = (content: string) =>
  content
    .replace(FENCE_PATTERN, " ")
    .replace(RAW_BLOCK_PATTERN, " ")
    .replace(IMAGE_PATTERN, " ");

/* What is left once the blocks are gone, all of it line-local */
const stripInline = (content: string) =>
  content
    .replace(LINK_PATTERN, "$1")
    .replace(HTML_TAG_PATTERN, " ")
    .replace(HEADING_MARK_PATTERN, "")
    .replace(EMPHASIS_PATTERN, "");

function toProse(content: string): string {
  return stripInline(stripBlocks(content));
}

export function getProseStats(content: string): {
  words: number;
  minutes: number;
} {
  const words = toProse(content)
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;

  /* The usual 200 wpm long-form estimate, floored at one minute */
  return { words, minutes: Math.max(1, Math.round(words / 200)) };
}

/**
 * The catchword: the opening words of a post's first real paragraph, the
 * hand-press convention where a page's foot printed the first word of the
 * next page to carry the reader across the turn.
 */
export function getOpeningWords(content: string, count = 8): string {
  const lines = stripBlocks(content).split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    /* Anything that is not running prose: headings, quotes, lists, tables,
       and any raw tag left standing outside a stripped block */
    if (/^(#|<|>|[-*+]\s|\d+\.\s|\|)/.test(trimmed)) continue;

    const words = stripInline(trimmed)
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean);
    if (words.length < 3) continue;

    return words.slice(0, count).join(" ");
  }

  return "";
}
