/* The slip's measure for prose it did not write: enough to say what the
   destination is, not enough to read it there */
export const EXCERPT_WORD_BUDGET = 60;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/* The entities a head is likely to carry: the named handful above and
   any numeric reference. Anything else stays as written. */
export function decodeEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (whole, entity: string) => {
      if (entity[0] === "#") {
        const code =
          entity[1] === "x" || entity[1] === "X"
            ? parseInt(entity.slice(2), 16)
            : parseInt(entity.slice(1), 10);
        /* Past the last code point, or a lone surrogate, fromCodePoint
           throws; a head that carries one prints the replacement mark */
        const valid =
          Number.isFinite(code) &&
          code <= 0x10ffff &&
          !(code >= 0xd800 && code <= 0xdfff);
        return valid ? String.fromCodePoint(code) : "�";
      }
      return NAMED_ENTITIES[entity.toLowerCase()] ?? whole;
    }
  );
}

export const collapseWhitespace = (text: string) =>
  text.replace(/\s+/g, " ").trim();

/**
 * The first `budget` words of a plain text, cut on a word boundary, and
 * whether anything was left behind.
 */
export function cutWords(
  text: string,
  budget = EXCERPT_WORD_BUDGET
): { text: string; truncated: boolean } {
  const words = collapseWhitespace(text).split(" ").filter(Boolean);
  return {
    text: words.slice(0, budget).join(" "),
    truncated: words.length > budget,
  };
}
