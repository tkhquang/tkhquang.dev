import BlogMasthead from "@/components/blog/BlogMasthead";
import NewsFeed from "@/components/blog/NewsFeed";
import ClientSideGetPageViews from "@/components/container/ClientSideGetPageViews";
import { Blog } from "@/constants/meta";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { pageMetadata } from "@/utils/metadata";
import { getVolume } from "@/utils/volume";
import { chunk } from "es-toolkit";
import { Metadata, ResolvingMetadata } from "next/types";
import { Suspense } from "react";

export async function generateStaticParams() {
  const markdownParser = await getMarkdownParser();
  const posts = await markdownParser.getAllPosts();
  const postChunks = chunk(posts, Blog.POSTS_PER_PAGE);

  return postChunks.map((_posts, index) => ({
    page: String(index + 1),
  }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ page: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const page = +(await params).page;

  const markdownParser = await getMarkdownParser();
  const posts = await markdownParser.getAllPosts();
  const totalPages = chunk(posts, Blog.POSTS_PER_PAGE).length;
  const { alternates } = await parent;

  /* Page one is what /blog rewrites to, so it is the front page and keeps the
     segment's own title, description and card. It points its canonical at
     /blog all the same: the pagination links page one by its real path, which
     leaves two addresses serving one page. Declaring alternates replaces the
     segment's rather than merging, so the layout's feed is carried across. */
  const canonical = page === 1 ? "/blog" : `/blog/page/${page}`;

  if (page === 1) {
    return {
      alternates: {
        canonical,
        types: alternates?.types ?? undefined,
      },
    };
  }

  return {
    ...pageMetadata({
      description: `Older entries, page ${page} of ${totalPages}. Devlogs, deep dives, and whatever I broke that month.`,
      siteName: Blog.METADATA.siteName,
      title: `Page ${page}`,
      url: canonical,
    }),
    alternates: {
      canonical,
      types: alternates?.types ?? undefined,
    },
  };
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

  const shelfCount = new Set(allPosts.map((post) => post.category_slug)).size;
  const volume = getVolume(allPosts);

  return (
    <>
      <BlogMasthead
        totalPosts={allPosts.length}
        shelfCount={shelfCount}
        volume={volume}
      />
      <NewsFeed posts={posts} totalPages={totalPages} />
      <Suspense>
        <ClientSideGetPageViews
          pathnames={posts.map((post) => `/blog/posts/${post.slug}`)}
        />
      </Suspense>
    </>
  );
}
