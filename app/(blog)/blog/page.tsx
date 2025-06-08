import NewsFeed from "@/components/blog/NewsFeed";
import { getMarkdownParser } from "@/lib/MarkdownParser";

export const dynamic = "force-static";
export const revalidate = 86400;

export default async function BlogPage() {
  const markdownParser = await getMarkdownParser();
  const posts = await markdownParser.getAllPosts();

  return (
    <NewsFeed posts={posts} pathSlug="categories" pathInfoType="category" />
  );
}
