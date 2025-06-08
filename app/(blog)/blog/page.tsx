import { Suspense } from "react";
import NewsFeed from "@/components/blog/NewsFeed";
import ClientSideScrollRestorer from "@/components/container/ClientSideScrollRestorer";
import { getMarkdownParser } from "@/lib/MarkdownParser";

export const dynamic = "force-static";
export const revalidate = 86400;

export default async function BlogPage() {
  const markdownParser = await getMarkdownParser();
  const posts = await markdownParser.getAllPosts();

  return (
    <>
      <NewsFeed posts={posts} pathSlug="categories" pathInfoType="category" />
      <Suspense>
        <ClientSideScrollRestorer />
      </Suspense>
    </>
  );
}
