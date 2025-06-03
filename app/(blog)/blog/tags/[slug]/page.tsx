import NewsFeed from "@/components/blog/NewsFeed";

export async function generateStaticParams() {
  const tags = await _MarkdownParser.getAllTags();

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

  const tags = await _MarkdownParser.getAllTags();
  const posts = await _MarkdownParser.getAllPosts();

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
