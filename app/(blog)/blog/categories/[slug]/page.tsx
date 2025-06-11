import NewsFeed from "@/components/blog/NewsFeed";
import { getMarkdownParser } from "@/lib/MarkdownParser";

export async function generateStaticParams() {
  const markdownParser = await getMarkdownParser();
  const categories = await markdownParser.getAllCategories();

  return categories.map((category) => ({
    slug: category.slug,
  }));
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

  return (
    <NewsFeed
      posts={filteredPost}
      pathInfoType="category"
      item={category}
      pathSlug="categories"
    />
  );
}
