import type { CrossReferenceTarget } from "./types";

/* A post route, root-relative, with at most a section fragment after it.
   Nothing else earns a slip: the index rooms print their own titles, a
   query string means a page this site does not serve, and an external
   address is somebody else's document. */
const POST_HREF_PATTERN = /^\/blog\/posts\/([\w.~-]+)\/?(?:#([^#?/]+))?$/;

/**
 * Reads a slug and an optional section id out of an internal post link,
 * or returns null when the link is not one.
 */
export function parseCrossReference(href: string): CrossReferenceTarget | null {
  const match = POST_HREF_PATTERN.exec(href);
  if (!match) return null;
  const [, slug, sectionId] = match;
  return sectionId ? { slug, sectionId } : { slug };
}
