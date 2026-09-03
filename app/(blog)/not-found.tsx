import LostFolio from "@/components/blog/LostFolio";
import { getMarkdownParser } from "@/lib/MarkdownParser";

/* The blog's own 404, in the blog shell with a real 404 status: a
   celestial plate whose surveyed patch is empty, and a finding aid that
   is always inside the viewport */
export default async function BlogNotFound() {
  const markdownParser = await getMarkdownParser();
  const posts = await markdownParser.getAllPosts();

  return <LostFolio newest={posts.slice(0, 3)} />;
}
