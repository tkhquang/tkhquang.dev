import NewsFeed from "@/components/blog/NewsFeed";
import ClientSideGetPageViews from "@/components/container/ClientSideGetPageViews";
import { Blog } from "@/constants/meta";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { getIntl } from "@/lib/intl";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { pageMetadata } from "@/utils/metadata";
import { Metadata } from "next/types";
import { Suspense } from "react";

export async function generateStaticParams() {
  const markdownParser = await getMarkdownParser();
  const categories = await markdownParser.getAllCategories();

  return categories.map((category) => ({
    slug: category.slug,
  }));
}

/* The article is the title's, not the room label's: the shelf file for
   the-inner-crisis is titled "The Inner Crisis". The headpiece and the card
   print the same room name, so the formula lives here once. */
const shelfRoom = (title: string) =>
  `The ${title.replace(/^The\s+/i, "")} Shelf`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const slug = decodeURIComponent((await params).slug);

  const markdownParser = await getMarkdownParser();
  const category = await markdownParser.getCategoryBySlug(slug);
  const posts = await markdownParser.getAllPosts();

  /* The count the headpiece prints, from the same filter, so the card cannot
     promise a fuller shelf than the page opens on */
  const shelved = posts.filter((post) => post.category_slug === slug);
  const intl = getIntl(DEFAULT_LOCALE);

  const room = shelfRoom(category.title);

  return pageMetadata({
    description: `${intl.formatMessage(
      { id: "postCount" },
      { count: shelved.length }
    )} on ${room.replace(/^The /, "the ")}, newest first: everything here filed under ${category.title}.`,
    siteName: Blog.METADATA.siteName,
    title: room,
    url: `/blog/categories/${slug}`,
  });
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
        headpiece={{
          room: shelfRoom(category.title),
          title: category.title,
          stat: intl.formatMessage(
            { id: "postCount" },
            { count: filteredPost.length }
          ),
          hue: `var(--shelf-${slug}, var(--primary))`,
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
