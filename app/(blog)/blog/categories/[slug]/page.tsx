import NewsFeed from "@/components/blog/NewsFeed";

export async function generateStaticParams() {
  const categories = await _MarkdownParser.getAllCategories();

  return categories.map((category) => ({
    slug: category.slug,
  }));
}

export const dynamic = "force-static";
export const revalidate = false;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;

  const posts = await _MarkdownParser.getAllPosts();
  const category = await _MarkdownParser.getCategoryBySlug(slug);
  const filteredPost = posts.filter((post) => post.category_slug === slug);

  return (
    <NewsFeed
      posts={filteredPost}
      pathInfoType="category"
      item={category}
      pathSlug="categories"
      title="Categories"
    />
  );
}
