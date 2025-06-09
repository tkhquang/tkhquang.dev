import NewsFeed from "@/components/blog/NewsFeed";
import ClientSideGetPageViews from "@/components/container/ClientSideGetPageViews";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { Suspense } from "react";

export const dynamic = "force-static";
export const revalidate = 86400;

export default async function BlogPage() {
  const markdownParser = await getMarkdownParser();
  const posts = await markdownParser.getAllPosts();

  return (
    <>
      <NewsFeed posts={posts} pathSlug="categories" pathInfoType="category" />
      <Suspense>
        <ClientSideGetPageViews
          pathnames={posts.map((post) => `/blog/posts/${post.slug}`)}
        />
      </Suspense>
    </>
  );
}
