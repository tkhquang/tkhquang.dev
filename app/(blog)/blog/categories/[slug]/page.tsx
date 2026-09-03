import NewsFeed from "@/components/blog/NewsFeed";
import ClientSideGetPageViews from "@/components/container/ClientSideGetPageViews";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { getIntl } from "@/lib/intl";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { Metadata } from "next/types";
import { Suspense } from "react";

export async function generateStaticParams() {
  const markdownParser = await getMarkdownParser();
  const categories = await markdownParser.getAllCategories();

  return categories.map((category) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const slug = decodeURIComponent((await params).slug);

  const markdownParser = await getMarkdownParser();
  const category = await markdownParser.getCategoryBySlug(slug);

  return {
    title: category.title,
  };
}

export const dynamic = "force-static";
export const revalidate = false;
export const dynamicParams = false;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = decodeURIComponent((await params).slug);

  const markdownParser = await getMarkdownParser();
  const posts = await markdownParser.getAllPosts();
  const category = await markdownParser.getCategoryBySlug(slug);
  const filteredPost = posts.filter((post) => post.category_slug === slug);
  const intl = getIntl(DEFAULT_LOCALE);

  return (
    <>
      <NewsFeed
        posts={filteredPost}
        pathInfoType="category"
        item={category}
        pathSlug="categories"
        headpiece={{
          room: `The ${category.title} Shelf`,
          stat: intl.formatMessage(
            { id: "postCount" },
            { count: filteredPost.length }
          ),
          hue: `var(--shelf-${slug})`,
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
