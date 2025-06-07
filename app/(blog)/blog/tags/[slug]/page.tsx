import NewsFeed from "@/components/blog/NewsFeed";
import { getMarkdownParser } from "@/lib/MarkdownParser";

export async function generateStaticParams() {
  const markdownParser = await getMarkdownParser();
  const tags = await markdownParser.getAllTags();

  return tags.map((tag) => ({
    slug: tag.slug,
  }));
}

export const dynamic = "force-static";
export const revalidate = false;

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = decodeURIComponent((await params).slug);

  const markdownParser = await getMarkdownParser();
  const tags = await markdownParser.getAllTags();
  const posts = await markdownParser.getAllPosts();

  const currentTag = tags.find((tag) => tag.slug === slug);

  const filteredPost = posts.filter((post) =>
    post.tags.includes(currentTag?.title!)
  );

  return (
    <NewsFeed
      posts={filteredPost}
      pathInfoType="tag"
      pathSlug="tags"
      item={currentTag}
    />
  );
}
