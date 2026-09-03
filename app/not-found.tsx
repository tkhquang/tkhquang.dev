import "@/assets/styles/(blog)/index.css";
import LostFolio from "@/components/blog/LostFolio";
import { Main } from "@/components/layout";
import BlogFooter from "@/components/layout/BlogFooter";
import BlogHeader from "@/components/layout/BlogHeader";
import { DEFAULT_LOCALE, getMessages } from "@/lib/i18n";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import AppProvider from "@/providers/AppProvider";
import { getVolume } from "@/utils/volume";

/*
 * The one 404 for the whole site: a wrong path is a wrong path, so every
 * unmatched URL lands on Plate 404 in the library's shell with a real
 * 404 status. No catch-all routes needed; this boundary is what Next
 * serves for anything nothing else claims.
 */
export default async function NotFound() {
  const markdownParser = await getMarkdownParser();
  const posts = await markdownParser.getAllPosts();

  return (
    <AppProvider locale={DEFAULT_LOCALE} messages={getMessages(DEFAULT_LOCALE)}>
      <BlogHeader
        indexStats={{
          posts: posts.length,
          categories: new Set(posts.map((post) => post.category_slug)).size,
          tags: new Set(posts.flatMap((post) => post.tags)).size,
          volume: getVolume(posts),
          year: new Date().getFullYear(),
        }}
      />
      <Main className="flex-1">
        <LostFolio newest={posts.slice(0, 3)} />
      </Main>
      <BlogFooter />
    </AppProvider>
  );
}
