import { getSlipKey, PREVIEW_TITLE } from "./key";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import type { Root } from "hast";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import "server-only";

export interface SlipTarget {
  href: string;
  /* The post that cites it, for the build log */
  slug: string;
}

/* The same road the article takes to its anchors, so the href read here
   is byte for byte the href the plugin keys the card on: a link the
   markdown or the raw parser rewrote would otherwise be written under
   one key and asked for under another */
const parser = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw);

/* The links a post asks a slip for, in both of the shapes the posts
   write links in: markdown links titled "preview", and raw anchors
   marked data-preview */
export function findPreviewLinks(markdown: string): string[] {
  const hrefs: string[] = [];
  const tree = parser.runSync(parser.parse(markdown)) as Root;
  visit(tree, "element", (node) => {
    if (node.tagName !== "a") return;
    const { href, title } = node.properties;
    const marked = "dataPreview" in node.properties || title === PREVIEW_TITLE;
    if (marked && typeof href === "string") hrefs.push(href);
  });
  return hrefs;
}

/**
 * Every link with a slip across the published posts, keyed as the cards
 * are served: the static route prerenders exactly this set at build.
 */
export async function collectSlipTargets(): Promise<Map<string, SlipTarget>> {
  const parser = await getMarkdownParser();
  const posts = await parser.getAllPosts();
  const targets = new Map<string, SlipTarget>();
  for (const post of posts) {
    for (const href of findPreviewLinks(post.content)) {
      const key = getSlipKey(href);
      if (!targets.has(key)) targets.set(key, { href, slug: post.slug });
    }
  }
  return targets;
}
