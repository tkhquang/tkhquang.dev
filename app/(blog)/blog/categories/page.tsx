import PostList from "@/components/blog/PostList";
import { MarkdownCategory, MarkdownPost } from "@/models/markdown.types";

export const dynamic = "force-static";
export const revalidate = 86400;

export default async function CategoriesPage() {
  const categories = await _MarkdownParser.getAllCategories();
  const posts = await _MarkdownParser.getAllPosts();

  const groupedPostsByCategorySlug = posts.reduce(
    (acc, post) => {
      return {
        ...acc,
        [post.category_slug]: [...(acc[post.category_slug] || []), post],
      };
    },
    {} as Record<string, MarkdownPost[]>
  );

  return (
    <PostList<MarkdownCategory, "slug">
      title="Categories"
      list={categories}
      listSlugField="slug"
      groupedPostsBySlug={groupedPostsByCategorySlug}
    />
  );
}
