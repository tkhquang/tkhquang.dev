import NewsFeed from "@/components/blog/NewsFeed";

export const dynamic = "force-static";
export const revalidate = 86400;

export default async function BlogPage() {
  const posts = await _MarkdownParser.getAllPosts();

  return <NewsFeed posts={posts} />;
}
