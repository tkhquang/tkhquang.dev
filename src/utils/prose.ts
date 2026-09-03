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

function toProse(content: string): string {
  return content
    .replace(FENCE_PATTERN, " ")
    .replace(RAW_BLOCK_PATTERN, " ")
    .replace(IMAGE_PATTERN, " ")
    .replace(LINK_PATTERN, "$1")
    .replace(HTML_TAG_PATTERN, " ")
    .replace(HEADING_MARK_PATTERN, "")
    .replace(EMPHASIS_PATTERN, "");
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
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    /* Skip anything that is not running prose: headings, fences, raw
       HTML, images, quotes, lists, tables */
    if (/^(#|```|<|!\[|>|[-*+]\s|\d+\.\s|\|)/.test(trimmed)) continue;

    const prose = toProse(trimmed).replace(/\s+/g, " ").trim();
    const words = prose.split(" ").filter(Boolean);
    if (words.length < 3) continue;

    return words.slice(0, count).join(" ");
  }

  return "";
}
