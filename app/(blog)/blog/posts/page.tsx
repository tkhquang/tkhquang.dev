import PostList from "@/components/blog/PostList";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { MarkdownPost } from "@/models/markdown.types";
import { toRoman } from "@/utils/roman";
import { getVolume } from "@/utils/volume";
import { Metadata } from "next/types";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Archive",
};

export default async function ArchivePage() {
  const markdownParser = await getMarkdownParser();
  const posts = await markdownParser.getAllPosts();

  const groupedPostsByYear = posts.reduce(
    (acc, post) => {
      const year = String(post.created_at.getFullYear());

      return {
        ...acc,
        [year]: [...(acc[year] || []), post],
      };
    },
    {} as Record<string, MarkdownPost[]>
  );

  const years = Object.keys(groupedPostsByYear).sort((a, b) => +b - +a);

  return (
    <PostList
      title="Archive"
      room="The Ledger"
      stat={`${posts.length} entries · Vol. ${toRoman(getVolume(posts))}`}
      list={years.map((year) => ({ slug: year, title: year }))}
      groupedPostsBySlug={groupedPostsByYear}
      defaultOpen={years.slice(0, 1)}
    />
  );
}
