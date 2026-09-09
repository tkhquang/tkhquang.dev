import { Site } from "@/constants/meta";
import { renderPostMarkdown } from "@/lib/markdown-export";
import { getMarkdownParser } from "@/lib/MarkdownParser";

export const dynamic = "force-static";
export const revalidate = false;
export const dynamicParams = false;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function generateStaticParams() {
  const markdownParser = await getMarkdownParser();
  const posts = await markdownParser.getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const slug = (await params).slug;

  const markdownParser = await getMarkdownParser();
  /* The roster rather than a single read: getAllPosts is what drops the
     unpublished entries and what fills in series_total */
  const posts = await markdownParser.getAllPosts();
  const post = posts.find((entry) => entry.slug === slug);

  if (!post) {
    return new Response("Not found\n", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const markdown = renderPostMarkdown(post, {
    author: Site.AUTHOR,
    baseUrl: BASE_URL,
  });

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
