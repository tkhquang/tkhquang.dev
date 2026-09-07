import { getAnnotationRecord } from "@/lib/annotations";
import { getPostPreview, parseCrossReference } from "@/lib/post-previews";
import "server-only";

/**
 * Whether a link's card can be served: the post and its section exist,
 * or the destination off the site gave an annotation. Asked at markdown
 * time for every link that asked for a slip, so a link nothing can be
 * served for renders as the plain link it was, with no mark promising a
 * card. The annotation fetched here is the one the static route reads
 * back from the cache when it writes the card.
 */
export async function hasSlipCard(href: string): Promise<boolean> {
  const target = parseCrossReference(href);
  if (target) {
    return (await getPostPreview(target.slug, target.sectionId)) !== null;
  }
  return (await getAnnotationRecord(href))?.annotation !== undefined;
}
