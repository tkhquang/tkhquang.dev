import ClientSideGetPageViews from "@/components/container/ClientSideGetPageViews";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { Suspense } from "react";

import BlogMasthead from "@/components/blog/BlogMasthead";
import NewsFeed from "@/components/blog/NewsFeed";
import { chunk } from "es-toolkit";
import { Blog } from "@/constants/meta";

export async function generateStaticParams() {
  const markdownParser = await getMarkdownParser();
  const posts = await markdownParser.getAllPosts();
  const postChunks = chunk(posts, Blog.POSTS_PER_PAGE);

  return postChunks.map((_posts, index) => ({
    page: String(index + 1),
  }));
}

export const dynamic = "force-static";
export const revalidate = false;
export const dynamicParams = false;

export default async function BlogPage({ params }: any) {
  const page = +(await params).page;

  const markdownParser = await getMarkdownParser();
  const allPosts = await markdownParser.getAllPosts();
  const postChunks = chunk(allPosts, Blog.POSTS_PER_PAGE);
  const posts = postChunks[page - 1];
  const totalPages = postChunks.length;
  const currentPage = page;

  const shelfCount = new Set(allPosts.map((post) => post.category_slug)).size;

  const sinceYear = allPosts.reduce(
    (year, post) => Math.min(year, post.created_at.getFullYear()),
    new Date().getFullYear()
  );

  return (
    <>
      <BlogMasthead
        totalPosts={allPosts.length}
        sinceYear={sinceYear}
        shelfCount={shelfCount}
      />
      <NewsFeed
        posts={posts}
        pathSlug="categories"
        pathInfoType="category"
        totalPages={totalPages}
        currentPage={currentPage}
        hideTitle
      />
      <Suspense>
        <ClientSideGetPageViews
          pathnames={posts.map((post) => `/blog/posts/${post.slug}`)}
        />
      </Suspense>
    </>
  );
}
