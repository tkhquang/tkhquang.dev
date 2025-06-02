import Script from "next/script";
import { Metadata } from "next/types";
import BlogInfo from "@/components/blog/BlogInfo";
import { PathInfo } from "@/components/blog/PathInfo";
import PostMeta from "@/components/blog/PostMeta";
import TagList from "@/components/blog/PostTag";
import TableOfContent from "@/components/blog/TableOfContent";
import { Site } from "@/constants/meta";
import { MarkdownCategory } from "@/models/markdown.types";

export async function generateStaticParams() {
  const posts = await _MarkdownParser.getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const slug = (await params).slug;
  const { cover_image, description, title } =
    await _MarkdownParser.getPostBySlug(slug);
  return {
    description,
    openGraph: {
      description,
      images: [
        {
          url: cover_image || Site.METADATA.coverImageUrl,
        },
      ],
      title,
    },
    title,
  };
}

export const dynamic = "force-static";
export const revalidate = false;

const MERMAIDJS_SCRIPT_CONTENT = `
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.esm.min.mjs";
  mermaid.initialize({startOnLoad: true});
  mermaid.contentLoaded();
`;

export default async function Post({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const post = await _MarkdownParser.getPostBySlug(slug);
  const {
    data: { toc: headings },
    result: html,
  } = await _MarkdownParser.parseMarkdown(post.content);

  const category = await _MarkdownParser.getCategoryBySlug(post.category_slug);

  const activeAnchor = "x";

  return (
    <div>
      <header
        className="header__wrapper relative flex flex-col overflow-hidden bg-center"
        style={{
          ...((post.cover_image && {
            "--background-url": `url(${post.cover_image})`,
            maxHeight: "50vh",
          }) as React.CSSProperties),
        }}
      >
        {post.cover_image &&
          post.renderCoverImage({
            className:
              "header__image m-auto block min-h-full w-full object-contain",
            height: 720,
            width: 1280,
          })}
      </header>
      <h1 className="heading mx-auto my-8 w-full text-center text-3xl md:w-10/12 lg:text-5xl">
        {post.title}
      </h1>

      <div className="flex">
        <TableOfContent headings={headings} />

        <section className="container !max-w-screen-md">
          <article className="article">
            <div className="article__meta mb-6 mt-3">
              <PostMeta post={post} />
            </div>
            <div className="article__path-info">
              <PathInfo<MarkdownCategory, "slug">
                item={category}
                pathInfoType="category"
                pathSlug="categories"
              />
            </div>

            <div className="article__content typography">{html}</div>
            <Script
              id="mermaidjs"
              type="module"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: MERMAIDJS_SCRIPT_CONTENT,
              }}
            />

            <div className="article__footer my-6 flex">
              <TagList post={post} />
            </div>
            <hr className="my-6" />
            <div className="w-full">
              <BlogInfo />
            </div>
            <hr className="my-6" />
            <div className="article-comments w-full rounded p-2 shadow-md"></div>
            {/* <hr className="my-6" /> */}
          </article>
        </section>

        <section className="underconstruction hidden flex-auto flex-col lg:flex">
          <p>&nbsp;</p>
        </section>
      </div>
    </div>
  );
}
