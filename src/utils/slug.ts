import slugify from "slugify";

/**
 * Slugify a tag title for use as a URL segment.
 *
 * slugify's default filter keeps `:`, `*` and `"`, which Windows forbids in
 * path components, and Next writes each tag slug as a directory under
 * `.next/server`, so a tag like "Kingdom Come: Deliverance II" breaks
 * `next build` on Windows. The `remove` option *replaces* the default filter
 * rather than extending it, so this is slugify's own default keep-list
 * (`/[^\w\s$*_+~.()'"!\-:@]+/g`) with those three characters dropped.
 */
export const slugifyTag = (tag: string): string =>
  slugify(tag, { lower: true, remove: /[^\w\s$_+~.()'!\-@]+/g });
