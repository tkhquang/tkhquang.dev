import { collapseWhitespace, decodeEntities } from "./text";

export interface HtmlMeta {
  title?: string;
  description?: string;
  siteName?: string;
  image?: string;
}

/* The value of one attribute on a tag, whichever quote it wears */
function readAttribute(tag: string, name: string): string | undefined {
  const match = new RegExp(
    `\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`,
    "i"
  ).exec(tag);
  if (!match) return undefined;
  return match[1] ?? match[2] ?? match[3];
}

/**
 * What a page's head says about it, read from the raw markup without a
 * parser: the meta tags are flat and a head that needs a DOM to read is
 * not one worth a card. Open Graph outranks the plain tags, and the
 * document title stands in when neither names the page.
 */
export function parseHtmlMeta(html: string): HtmlMeta {
  const head = html.slice(0, 200_000);
  const meta: Record<string, string> = {};

  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (
      readAttribute(tag, "property") ?? readAttribute(tag, "name")
    )?.toLowerCase();
    const content = readAttribute(tag, "content");
    if (!key || content === undefined || key in meta) continue;
    meta[key] = collapseWhitespace(decodeEntities(content));
  }

  const titleTag = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(head);
  const documentTitle = titleTag
    ? collapseWhitespace(decodeEntities(titleTag[1]))
    : undefined;

  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = meta[key];
      if (value) return value;
    }
    return undefined;
  };

  const image = pick("og:image", "twitter:image");

  return {
    title: pick("og:title", "twitter:title") ?? documentTitle,
    description: pick("og:description", "description", "twitter:description"),
    siteName: pick("og:site_name"),
    /* Only a picture the web serves: a relative path would resolve
       against this site, and a data uri has no business in a card */
    image: image && /^https?:\/\//i.test(image) ? image : undefined,
  };
}
