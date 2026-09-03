import NewsFeed from "@/components/blog/NewsFeed";
import ClientSideGetPageViews from "@/components/container/ClientSideGetPageViews";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { Metadata } from "next/types";
import { Suspense } from "react";

export async function generateStaticParams() {
  const markdownParser = await getMarkdownParser();
  const tags = await markdownParser.getAllTags();

  return tags.map((tag) => ({
    slug: tag.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const slug = decodeURIComponent((await params).slug);

  const markdownParser = await getMarkdownParser();
  const tags = await markdownParser.getAllTags();
  const currentTag = tags.find((tag) => tag.slug === slug)!;

  return {
    title: currentTag.title,
  };
}

export const dynamic = "force-static";
export const revalidate = false;
export const dynamicParams = false;

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = decodeURIComponent((await params).slug);

  const markdownParser = await getMarkdownParser();
  const tags = await markdownParser.getAllTags();
  const posts = await markdownParser.getAllPosts();

  const currentTag = tags.find((tag) => tag.slug === slug)!;

  const filteredPost = posts.filter((post) =>
    post.tags.includes(currentTag?.title)
  );

  return (
    <>
      <NewsFeed
        posts={filteredPost}
        pathInfoType="tag"
        pathSlug="tags"
        item={currentTag}
        headpiece={{
          room: "Entries Tagged",
          stat: `Tagged in ${filteredPost.length} ${filteredPost.length === 1 ? "post" : "posts"}`,
          hashed: true,
        }}
      />
      <Suspense>
        <ClientSideGetPageViews
          pathnames={filteredPost.map((post) => `/blog/posts/${post.slug}`)}
        />
      </Suspense>
    </>
  );
}
