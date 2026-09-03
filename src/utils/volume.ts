import { MarkdownPost } from "@/models/markdown.types";

/* Print volume counts calendar years, newspaper style: the first post's
   year is Vol. I. Frozen at build time, which every deploy refreshes. */
export function getVolume(posts: MarkdownPost[]): number {
  const sinceYear = posts.reduce(
    (year, post) => Math.min(year, post.created_at.getFullYear()),
    new Date().getFullYear()
  );
  return new Date().getFullYear() - sinceYear + 1;
}
