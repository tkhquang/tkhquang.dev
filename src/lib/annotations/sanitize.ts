import type { Root } from "hast";
import { fromHtml } from "hast-util-from-html";
import { defaultSchema, sanitize, type Schema } from "hast-util-sanitize";
import { toHtml } from "hast-util-to-html";
import { visit } from "unist-util-visit";

/* GitHub's own allowance, which is what its rendered bodies are written
   to, plus the little the slip needs: image sizes so a picture does
   not reflow the card as it loads, the classes the code printing and
   GitHub's chips carry, and the ids the bodies link back into */
const schema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className", "id"],
    img: [...(defaultSchema.attributes?.img ?? []), "width", "height"],
  },
  /* Pictures only from the web, never from a data uri, and links only
     to the web; relative addresses are resolved against the destination
     below before this runs on the result */
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https"],
    href: ["http", "https", "mailto"],
  },
  /* GitHub already prefixes every id it renders with user-content-, and
     its bodies link back into themselves by those ids; prefixing them
     again would detach those links, so ids pass as written */
  clobber: [],
};

/* A relative address inside the destination's markup means a page on
   the destination, never one on this site; a fragment means a place in
   the destination's own page */
const resolveAgainst = (value: string, base: string): string | undefined => {
  try {
    return new URL(value, base).href;
  } catch {
    return undefined;
  }
};

/**
 * Third-party markup, as the card prints it: every link and picture
 * resolved against the page it came from, then parsed as a fragment,
 * reduced to GitHub's allowance, every link sent to a new tab with the
 * rel a foreign link carries on this site, every picture left to load
 * lazily, then serialized again. Nothing that scripts, styles, frames
 * or forms survives.
 */
export interface SanitizeOptions {
  /* Attributes to drop outright. A body rendered by GitHub or Wikipedia
     carries ids its own text links back into and classes its own chips
     are dressed by, and both are wanted. Markup read off an arbitrary
     page carries neither, and its ids would sit in this document beside
     the ids this document gave itself. */
  strip?: ("id" | "className")[];
}

export function sanitizeHtml(
  html: string,
  base: string,
  options: SanitizeOptions = {}
): string {
  /* The parser and the sanitizer each ship their own copy of the hast
     typings; the trees are the same shape */
  const parsed = fromHtml(html, { fragment: true }) as unknown as Root;
  visit(parsed, "element", (node) => {
    for (const name of ["href", "src"] as const) {
      const value = node.properties[name];
      if (typeof value !== "string") continue;
      const resolved = resolveAgainst(value, base);
      if (resolved) {
        node.properties[name] = resolved;
      } else {
        delete node.properties[name];
      }
    }
  });

  const tree = sanitize(
    parsed as unknown as Parameters<typeof sanitize>[0],
    schema
  ) as unknown as Root;
  visit(tree, "element", (node) => {
    for (const name of options.strip ?? []) delete node.properties[name];
    if (node.tagName === "a" && typeof node.properties.href === "string") {
      node.properties.target = "_blank";
      node.properties.rel = ["nofollow", "noopener", "noreferrer"];
    }
    if (node.tagName === "img") {
      node.properties.loading = "lazy";
      node.properties.decoding = "async";
      node.properties.referrerPolicy = "no-referrer";
    }
  });
  return toHtml(tree);
}
