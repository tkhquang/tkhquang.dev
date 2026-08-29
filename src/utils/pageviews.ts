import { getPostFiles } from "@/utils/posts";

const POST_PATHNAME_PATTERN = /^\/blog\/posts\/([^/]+)$/;

/**
 * Counters that are not site routes. The badge embedded in the GitHub profile
 * README uses this pathname as its key, so it must be accepted verbatim.
 */
const EXTERNAL_PATHNAMES = new Set(["https://github.com/tkhquang"]);

const POST_SLUGS = new Set(
  getPostFiles().map((file) => file.replace(/\.md$/, ""))
);

/**
 * Page view pathnames are joined into Redis keys with ":", so an unvalidated
 * value lets a caller create unbounded keys and forge keys in neighbouring
 * namespaces. Only known pathnames may reach Redis. `pathname` is `unknown`
 * because one caller reads it from an untyped JSON body.
 */
export function isAllowedPathname(pathname: unknown): boolean {
  if (typeof pathname !== "string") {
    return false;
  }

  if (pathname === "/" || EXTERNAL_PATHNAMES.has(pathname)) {
    return true;
  }

  const match = POST_PATHNAME_PATTERN.exec(pathname);

  // Membership in POST_SLUGS is the real bound: it caps both key length and
  // key cardinality, and a filename can never contain the ":" separator.
  return match !== null && POST_SLUGS.has(match[1]);
}
