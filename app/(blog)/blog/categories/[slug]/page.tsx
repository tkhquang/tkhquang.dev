import NewsFeed from "@/components/blog/NewsFeed";
import ClientSideGetPageViews from "@/components/container/ClientSideGetPageViews";
import { Blog } from "@/constants/meta";
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
        item={category}
        headpiece={{
          /* The article is the title's, not the room label's: the shelf
             file for the-inner-crisis is titled "The Inner Crisis" */
          room: `The ${category.title.replace(/^The\s+/i, "")} Shelf`,
          stat: intl.formatMessage(
            { id: "postCount" },
            { count: filteredPost.length }
          ),
          hue: `var(--shelf-${slug})`,
          swatchLabel:
            Blog.SHELF_HUE_NAMES[slug] ?? Blog.DEFAULT_SHELF_HUE_NAME,
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
