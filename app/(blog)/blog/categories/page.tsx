import PostList from "@/components/blog/PostList";
import { Blog } from "@/constants/meta";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { getIntl } from "@/lib/intl";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { MarkdownCategory, MarkdownPost } from "@/models/markdown.types";
import { pageMetadata } from "@/utils/metadata";
import { Metadata } from "next/types";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const markdownParser = await getMarkdownParser();
  const categories = await markdownParser.getAllCategories();

  /* Naming the shelves beats counting them: a reader deciding whether to open
     this page wants the subjects, and reading them off the files means adding
     a shelf updates the card instead of dating it */
  const shelves = new Intl.ListFormat("en", {
    style: "long",
    type: "conjunction",
  }).format(categories.map((category) => category.title));

  return pageMetadata({
    description: `The shelves this writing is sorted into: ${shelves}. Open one to read its entries, newest first.`,
    siteName: Blog.METADATA.siteName,
    title: "Categories",
    url: "/blog/categories",
  });
}

export default async function CategoriesPage() {
  const markdownParser = await getMarkdownParser();
  const categories = await markdownParser.getAllCategories();
  const posts = await markdownParser.getAllPosts();

  const groupedPostsByCategorySlug = posts.reduce(
    (acc, post) => {
      return {
        ...acc,
        [post.category_slug]: [...(acc[post.category_slug] || []), post],
      };
    },
    {} as Record<string, MarkdownPost[]>
  );

  const intl = getIntl(DEFAULT_LOCALE);

  return (
    <PostList<MarkdownCategory, "slug">
      title="Categories"
      room="The Shelves"
      stat={`${intl.formatMessage({ id: "shelfCount" }, { count: categories.length })} · ${intl.formatMessage({ id: "postCount" }, { count: posts.length })}`}
      list={categories}
      listSlugField="slug"
      groupedPostsBySlug={groupedPostsByCategorySlug}
      /* Shelf ribbons, and every shelf open on arrival: three closed
         hairline rows in a blank column read as an empty page */
      getItemHue={(slug) => `var(--shelf-${slug}, var(--primary))`}
      defaultOpen={categories.map((category) => category.slug)}
    />
  );
}
