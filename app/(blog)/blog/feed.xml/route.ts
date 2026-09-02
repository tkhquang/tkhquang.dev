import { Blog } from "@/constants/meta";
import { getMarkdownParser } from "@/lib/MarkdownParser";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const markdownParser = await getMarkdownParser();
  const posts = await markdownParser.getAllPosts();
  const categories = await markdownParser.getAllCategories();

  const categoryTitleBySlug = new Map(
    categories.map((category) => [category.slug, category.title])
  );

  // Posts sort by created_at, so an edit to an older post must still
  // bump the feed stamp: take the max updated across entries
  const feedUpdated = posts.length
    ? new Date(
        Math.max(
          ...posts.map((post) =>
            new Date(post.updated_at || post.created_at).getTime()
          )
        )
      )
    : new Date();

  const entries = posts
    .map((post) => {
      const url = `${BASE_URL}/blog/posts/${post.slug}`;
      const updated = new Date(post.updated_at || post.created_at);
      const category =
        categoryTitleBySlug.get(post.category_slug) || post.category_slug;

      return `  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${escapeXml(url)}" />
    <id>${escapeXml(url)}</id>
    <updated>${updated.toISOString()}</updated>
    <summary>${escapeXml(post.description)}</summary>
    <category term="${escapeXml(category)}" />
  </entry>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Ljóss</title>
  <subtitle>${escapeXml(Blog.METADATA.description)}</subtitle>
  <link href="${escapeXml(`${BASE_URL}/blog/feed.xml`)}" rel="self" />
  <link href="${escapeXml(`${BASE_URL}/blog`)}" />
  <id>${escapeXml(`${BASE_URL}/blog`)}</id>
  <updated>${feedUpdated.toISOString()}</updated>
  <author>
    <name>${escapeXml(Blog.METADATA.author)}</name>
  </author>
${entries}
</feed>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
    },
  });
}
