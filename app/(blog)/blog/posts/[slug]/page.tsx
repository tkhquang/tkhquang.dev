import BlogInfo from "@/components/blog/BlogInfo";
import Comments from "@/components/blog/Comments";
import { PathInfo } from "@/components/blog/PathInfo";
import PostAside from "@/components/blog/PostAside";
import PostMeta from "@/components/blog/PostMeta";
import TagList from "@/components/blog/PostTag";
import RailSky from "@/components/blog/RailSky";
import RailSkyDriver from "@/components/blog/RailSkyDriver";
import TableOfContent from "@/components/blog/TableOfContent";
import NextImage, { ImageProps } from "@/components/common/NextImage";
import ReportView from "@/components/common/ReportView";
import ScriptLoader from "@/components/common/ScriptLoader";
import ClientSideGetPageViews from "@/components/container/ClientSideGetPageViews";
import { Site } from "@/constants/meta";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { MarkdownCategory } from "@/models/markdown.types";
import clsx from "clsx";
import { Metadata } from "next/types";
import { Suspense } from "react";

export async function generateStaticParams() {
  const markdownParser = await getMarkdownParser();
  const posts = await markdownParser.getAllPosts();

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

  const markdownParser = await getMarkdownParser();
  const { cover_image, description, title } =
    await markdownParser.getPostBySlug(slug);

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
export const dynamicParams = false;

const MERMAIDJS_SCRIPT_CONTENT = `
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.esm.min.mjs";
  mermaid.initialize({startOnLoad: true});
  mermaid.contentLoaded();
</script>
`;

export default async function Post({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;

  const markdownParser = await getMarkdownParser();
  const post = await markdownParser.getPostBySlug(slug);
  const {
    data: { toc: headings = [] },
    result: html,
  } = await markdownParser.parseMarkdown(post.content);

  const category = await markdownParser.getCategoryBySlug(post.category_slug);

  /* Posts embed diagrams as raw <pre class="mermaid"> blocks (fenced form
     kept for safety); skip the CDN module entirely when neither appears */
  const hasMermaidDiagram =
    post.content.includes('class="mermaid') ||
    post.content.includes("```mermaid");

  const relatedPosts = (await markdownParser.getAllPosts())
    .filter(
      (other) =>
        other.category_slug === post.category_slug && other.slug !== post.slug
    )
    .slice(0, 3);

  const coverWidth = post.coverDataExtra?.width;
  const coverHeight = post.coverDataExtra?.height;

  const coverProps: Partial<ImageProps> = {
    className: clsx(
      "header__image m-auto min-h-full",
      "size-full max-h-none",
      "md:h-[50vw] md:max-h-[50vh] md:w-auto"
    ),
    containerClassName: "",
    shouldShowBackground: true,
    height: coverHeight ?? 720,
    loading: "eager",
    priority: true,
    sizes: "(max-width: 768px) 100vw, 1024px",
    width: coverWidth ?? 1280,
    blurDataURL: post.coverData.blurDataURL,
    backgroundClassName: "dark:invert-0 invert",
    ...(coverWidth && coverHeight
      ? {
          style: {
            aspectRatio: coverWidth / coverHeight,
          },
        }
      : {}),
  };

  return (
    <div className="code-container">
      <Suspense>
        <ReportView />
        <ClientSideGetPageViews pathnames={[`/blog/posts/${post.slug}`]} />
      </Suspense>
      <header
        className={clsx(
          "header__wrapper relative flex flex-col overflow-hidden",
          "before:hidden md:before:block"
        )}
        style={{
          ...((post.cover_image && {
            "--background-url": `url(${post.coverData.blurDataURL})`,
          }) as React.CSSProperties),
        }}
      >
        {post.cover_image && <NextImage {...post.coverData} {...coverProps} />}
      </header>

      <h1 className="heading mx-auto mt-4 mb-8 w-full text-center text-3xl md:w-10/12 lg:text-5xl">
        {post.title}
      </h1>

      {/* The row hosts the article's view timeline (see RailSky.css): the
          section owns it, and both flanking rails consume it */}
      <div className="post-row flex">
        <TableOfContent headings={headings} />

        <section className="post-row__article container mx-auto max-w-(--breakpoint-md)!">
          <article className="article">
            <div className="article__path-info">
              <PathInfo<MarkdownCategory, "slug">
                item={category}
                pathInfoType="category"
                pathSlug="categories"
              />
            </div>
            {post.description && (
              <p className="article__lede my-4 font-serif text-lg italic opacity-85">
                {post.description}
              </p>
            )}
            <div className="article__meta border-theme-hairline-soft mt-3 mb-6 border-b pb-4">
              <PostMeta post={post} />
            </div>

            <div
              className="article__content typography"
              style={{
                overflowWrap: "break-word",
              }}
            >
              {html}
            </div>
            {hasMermaidDiagram && (
              <ScriptLoader content={MERMAIDJS_SCRIPT_CONTENT} />
            )}

            <div className="article__footer my-6 flex">
              <TagList post={post} />
            </div>
            <hr className="my-6" />
            <div className="w-full">
              <BlogInfo
                variant="wide"
                className="[&_.author]:space-x-0 md:[&_.author]:space-x-4 md:[&_.author]:px-8 md:[&_.author\_\_image--container]:mb-0 [&_img]:size-[120px]! md:[&_img]:size-[80px]!"
              />
            </div>
            <hr className="my-6" />
            <div className="article-comments w-full p-2">
              <Suspense>
                <Comments />
              </Suspense>
            </div>
            <div className="my-6" />
          </article>
        </section>

        {/* The wrapper takes over the flank's flex-item role so the aside
            keeps its stretch-and-stick behavior while the constellation
            fills the runway below its rail */}
        <div className="relative hidden min-w-0 flex-1 xl:flex">
          <PostAside
            categoryTitle={category.title}
            categorySlug={category.slug}
            posts={relatedPosts}
          />
          <RailSky />
          <RailSkyDriver />
        </div>
      </div>
    </div>
  );
}
