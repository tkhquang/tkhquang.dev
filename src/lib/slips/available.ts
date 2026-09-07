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
  const record = await getAnnotationRecord(href);
  if (!record?.annotation) {
    /* Said out loud, because the alternative is silence: a link that
       asked for a card and cannot have one keeps its words and loses
       its mark, and the post reads as though it never asked. A build
       that quietly drops the feature from every marked link, because
       the network was down or an API refused, looks exactly the same. */
    console.warn(
      `No card for ${href}: the link keeps its words and loses its mark`
    );
    return false;
  }
  return true;
}
