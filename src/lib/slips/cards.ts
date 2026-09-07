import type { AnnotationCard, SlipCard } from "./card";
import { getAnnotationRecord } from "@/lib/annotations";
import type { AnnotationRecord } from "@/lib/annotations/types";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { getPostPreview, parseCrossReference } from "@/lib/post-previews";
import { getTransclusionHtml } from "@/lib/post-previews/transclude";
import { format } from "date-fns";
import "server-only";

/* The dates a card prints are set here, at build, like every other date
   on the site; a client formatting the ISO string would print the day
   before for a reader west of UTC */
function toAnnotationCard(record: AnnotationRecord): AnnotationCard | null {
  const { annotation } = record;
  if (!annotation) return null;
  const iso =
    annotation.kind === "github-issue" || annotation.kind === "github-comment"
      ? annotation.createdAt
      : annotation.kind === "github-commit"
        ? annotation.date
        : undefined;
  const date = iso ? new Date(iso) : undefined;
  return {
    ...annotation,
    when:
      date && !Number.isNaN(date.getTime())
        ? format(date, "MMM dd, yyyy")
        : undefined,
    snapshot: record.snapshot,
    archive: record.archive,
  };
}

/**
 * The card served for a link: another post's entry with the markup it
 * links into, or the annotation of a destination off the site with the
 * copies kept of it. Null when nothing can be served, in which case the
 * link is left as the link it was.
 */
export async function getSlipCard(href: string): Promise<SlipCard | null> {
  const target = parseCrossReference(href);
  if (target) {
    const parser = await getMarkdownParser();
    const preview = await getPostPreview(target.slug, target.sectionId);
    if (!preview) return null;
    const post = await parser.getPostBySlug(target.slug);
    const tree = await parser.parseToHast(post.content);
    const html = getTransclusionHtml(
      tree,
      `/blog/posts/${target.slug}`,
      target.sectionId
    );
    if (!html) return null;
    return {
      kind: "post",
      preview,
      html,
      scope: target.sectionId ? "section" : "opening",
    };
  }

  const record = await getAnnotationRecord(href);
  const annotation = record && toAnnotationCard(record);
  return annotation ? { kind: "annotation", annotation } : null;
}
