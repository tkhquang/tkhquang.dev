import { Blog, Site } from "@/constants/meta";
import { getMarkdownParser } from "@/lib/MarkdownParser";

export const dynamic = "force-static";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

/* A title opening with a bracket, as the devlogs do, would otherwise close
   the link's own text and leave the URL as literal prose */
function escapeLinkTitle(title: string) {
  return title.replace(/([\\[\]])/g, "\\$1");
}

function isoDate(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

export async function GET() {
  const markdownParser = await getMarkdownParser();
  const posts = await markdownParser.getAllPosts();
  const postsBySlug = new Map(posts.map((post) => [post.slug, post]));

  /* Walking the curated slugs keeps the hand-picked order, and an entry that
     no longer resolves drops out rather than publishing a dead link: the
     parser has already filtered to published posts, so an unpublished or
     renamed slug simply has no post here. The dates trail the description in
     parentheses so the line does not depend on how that sentence ends. */
  const selectedPosts = Blog.CURATED_READING_SLUGS.flatMap((slug) => {
    const post = postsBySlug.get(slug);
    if (!post) return [];

    const dates = post.updated_at
      ? `Published ${isoDate(post.created_at)}, updated ${isoDate(post.updated_at)}`
      : `Published ${isoDate(post.created_at)}`;

    return [
      `- [${escapeLinkTitle(post.title)}](${BASE_URL}/blog/posts/${post.slug}): ${post.description} (${dates})`,
    ];
  }).join("\n");

  const index = `# tkhquang.dev

> I'm ${Site.AUTHOR.name}, or ${Site.AUTHOR.alias}. You'll find me online as ${Site.AUTHOR.handle}. Software engineer: web interfaces by day, native tools and game mods by night. Ljóss is my blog, where I write up the things I take apart.

These are a few places to start. Each one carries the code and the reasoning behind the investigation, and says where it stops. The archive has the rest, including the entries that are not about engineering.

## Selected investigations

${selectedPosts}

## Around the site

- [Portfolio](${BASE_URL}): My work, projects, and background.
- [Ljóss](${BASE_URL}/blog): The blog, newest entries first.
- [Archive](${BASE_URL}/blog/posts): Every published entry, grouped by year.
- [Colophon](${BASE_URL}/blog/colophon): How this site is put together.

## Markdown counterparts

Every published entry is also a Markdown file: put \`.md\` on the end of its address, so \`${BASE_URL}/blog/posts/<slug>\` becomes \`${BASE_URL}/blog/posts/<slug>.md\`. It comes out of the same source as the page, so the words are the same words. Diagrams arrive as Mermaid source, and a figure that needs a browser is named where it stands, with the page's address beside it.

## Citation guidance

Credit ${Site.AUTHOR.alias} (${Site.AUTHOR.name}, online as ${Site.AUTHOR.handle}), use the article's exact title and canonical URL from the links above, and include its published date. Include the updated date when the article shows one. A section link helps when citing a particular test or explanation.

These are accounts of work I did and things I observed. Keep the versions, conditions, and stated limits with the claim. Follow the linked evidence when a conclusion depends on it. These links lead to the current text of each entry: an updated date says an entry changed, not that the older wording is still readable somewhere.
`;

  return new Response(index, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
