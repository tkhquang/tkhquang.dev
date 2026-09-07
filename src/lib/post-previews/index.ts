import { findSection } from "./sections";
import type { PostPreview } from "./types";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { getProseStats } from "@/utils/prose";
import { format } from "date-fns";
import "server-only";

export { parseCrossReference } from "./parse";
export type { CrossReferenceTarget, PostPreview } from "./types";

/**
 * The card's head for a link to another post: the entry as the shelf
 * prints it, and the heading a section link points at. Null when the
 * post is not published or the section does not exist, so the link is
 * left as the link it was.
 */
export async function getPostPreview(
  slug: string,
  sectionId?: string
): Promise<PostPreview | null> {
  const parser = await getMarkdownParser();
  /* Through the full list rather than by file: only that pass annotates
     the serial size and the category title, and only it hides the
     unpublished */
  const post = (await parser.getAllPosts()).find(
    (entry) => entry.slug === slug
  );
  if (!post) return null;

  const section = sectionId ? findSection(post.content, sectionId) : null;
  if (sectionId && !section) return null;

  return {
    slug: post.slug,
    href: `/blog/posts/${post.slug}${sectionId ? `#${sectionId}` : ""}`,
    title: post.title,
    categorySlug: post.category_slug,
    categoryTitle: post.category_title ?? post.category_slug,
    date: format(post.created_at, "MMM dd, yyyy"),
    series: post.series,
    seriesPart: post.series_part,
    seriesTotal: post.series_total,
    minutes: getProseStats(post.content).minutes,
    lede: post.description,
    section: section ?? undefined,
  };
}
