import { classifyLink } from "../annotations/parse";
import { parseCrossReference } from "../post-previews/parse";
import { hasSlipCard } from "../slips/available";
import { getSlipKey, PREVIEW_TITLE } from "../slips/key";
import type { Element, Root } from "hast";
import { toString as hastToString } from "hast-util-to-string";
import type { Transformer } from "unified";
import { visit } from "unist-util-visit";

interface Options {
  /* Whether a card can be served for a link; the site's own check
     unless a caller brings one */
  hasSlipCard?: (href: string) => Promise<boolean>;
}

/**
 * Cross-references: a link the post has marked for a slip becomes a
 * `cross-reference` element carrying the key its card is served under,
 * which the component registry resolves into the link plus its slip.
 * Nothing is previewed unasked: a plain link stays a plain link. The
 * anchor's own properties ride along unchanged, so the anchor a post
 * authored (its target, its rel, its class) is the anchor that renders;
 * only the title that carried the request comes off, because it was
 * markup, not a tooltip. A marked link nothing can be served for (a
 * route that is not a post, a section the post no longer has, a
 * destination that gave nothing) stays a plain link too, with no mark
 * promising a card.
 * Runs after rehype-raw, because the posts write their internal links
 * as raw HTML anchors and those only exist as elements from there.
 */
export default function rehypeCrossReferences(
  options: Options = {}
): Transformer<Root> {
  const available = options.hasSlipCard ?? hasSlipCard;

  return async (tree) => {
    const asked: { node: Element; href: string }[] = [];
    visit(tree, "element", (node) => {
      if (node.tagName !== "a") return;
      const { href, title } = node.properties;
      const marked =
        "dataPreview" in node.properties || title === PREVIEW_TITLE;
      if (!marked || typeof href !== "string") return;

      delete node.properties.dataPreview;
      if (title === PREVIEW_TITLE) delete node.properties.title;

      if (parseCrossReference(href) || classifyLink(href)) {
        asked.push({ node, href });
      }
    });

    await Promise.all(
      asked.map(async ({ node, href }) => {
        if (!(await available(href))) return;
        node.tagName = "cross-reference";
        node.properties.dataSlip = getSlipKey(href);
        /* The star is named by the link's own words, which are known
           here and stable, rather than by a card that may not have been
           fetched when the star is reached */
        node.properties.dataSlipName = hastToString(node);
      })
    );
  };
}
