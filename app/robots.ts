import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      /* The search artifacts are a binary index and its engine, reachable by
         URL and linked from nothing. A crawler that fetches them learns
         nothing the archive pages do not already say in prose. */
      disallow: "/search/",
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
