import { getMarkdownParser } from "@/lib/MarkdownParser";
import { max } from "date-fns";
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

async function getAllBlogPosts() {
  const markdownParser = await getMarkdownParser();
  const posts = await markdownParser.getAllPosts();

  return posts;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllBlogPosts();

  // The newest post activity, so /blog does not claim a change on every build
  const postDates = posts
    .map((post) => post.updated_at || post.created_at)
    .filter(Boolean)
    .map((date) => new Date(date));
  const latestPostDate = postDates.length ? max(postDates) : undefined;

  const blogPostSiteMap = posts.map(({ slug, created_at, updated_at }) => {
    return {
      url: `${BASE_URL}/blog/posts/${slug}`,
      lastModified: updated_at || created_at || new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    } satisfies MetadataRoute.Sitemap[0];
  });

  return [
    {
      url: `${BASE_URL}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/music`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: latestPostDate || new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogPostSiteMap,
  ];
}
