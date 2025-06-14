import PostList from "@/components/blog/PostList";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { MarkdownPost } from "@/models/markdown.types";

export const dynamic = "force-static";
export const revalidate = 86400;

export default async function TagsPage() {
  const markdownParser = await getMarkdownParser();
  const tags = await markdownParser.getAllTags();
  const posts = await markdownParser.getAllPosts();

  const groupedPostsByTagSlug = tags.reduce(
    (acc, tag) => {
      const filteredPosts = posts.filter((post) => {
        return post.tags.includes(tag.title);
      });

      return {
        ...acc,
        [tag.slug]: [...(acc[tag.slug] || []), ...filteredPosts],
      };
    },
    {} as Record<string, MarkdownPost[]>
  );

  return (
    <PostList<(typeof tags)[0], "slug">
      title="Tags"
      list={tags}
      listSlugField="slug"
      groupedPostsBySlug={groupedPostsByTagSlug}
    />
  );
}
