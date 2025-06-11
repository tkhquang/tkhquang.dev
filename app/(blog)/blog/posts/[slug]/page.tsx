import BlogInfo from "@/components/blog/BlogInfo";
import Comments from "@/components/blog/Comments";
import { PathInfo } from "@/components/blog/PathInfo";
import PostMeta from "@/components/blog/PostMeta";
import TagList from "@/components/blog/PostTag";
import TableOfContent from "@/components/blog/TableOfContent";
import NextImage, { ImageProps } from "@/components/common/NextImage";
import ReportView from "@/components/common/ReportView";
import ScriptLoader from "@/components/common/ScriptLoader";
import ClientSideGetPageViews from "@/components/container/ClientSideGetPageViews";
import { Site } from "@/constants/meta";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { MarkdownCategory } from "@/models/markdown.types";
import { getPlaceholderImage } from "@/utils/next-mage";
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
    data: { toc: headings },
    result: html,
  } = await markdownParser.parseMarkdown(post.content);

  const category = await markdownParser.getCategoryBySlug(post.category_slug);
  const coverPlaceholder = post.cover_image
    ? (await getPlaceholderImage(post.cover_image as string)).placeholder
    : null;

  const coverProps: Partial<ImageProps> = {
    className: "header__image m-auto min-h-full w-auto",
    containerClassName: "",
    height: 720,
    loading: "eager",
    priority: true,
    style: {
      height: "50vw",
      maxHeight: "50vh",
    },
    width: 1280,
    backgroundClassName: "dark:invert-0 invert",
  };

  return (
    <div>
      <Suspense>
        <ReportView />
        <ClientSideGetPageViews pathnames={[`/blog/posts/${post.slug}`]} />
      </Suspense>
      <header
        className="header__wrapper relative flex flex-col overflow-hidden"
        style={{
          ...((post.cover_image && {
            "--background-url": `url(${coverPlaceholder})`,
          }) as React.CSSProperties),
        }}
      >
        {post.cover_image && <NextImage {...post.coverData!} {...coverProps} />}
      </header>

      <h1 className="heading mx-auto my-8 w-full text-center text-3xl md:w-10/12 lg:text-5xl">
        {post.title}
      </h1>

      <div className="flex">
        <TableOfContent headings={headings} />

        <section className="container !max-w-screen-md">
          <article className="article">
            <div className="article__meta my-3">
              <PostMeta post={post} />
            </div>
            <div className="article__path-info">
              <PathInfo<MarkdownCategory, "slug">
                item={category}
                pathInfoType="category"
                pathSlug="categories"
              />
            </div>

            <div
              className="article__content typography"
              style={{
                overflowWrap: "break-word",
              }}
            >
              {html}
            </div>
            <ScriptLoader content={MERMAIDJS_SCRIPT_CONTENT} />

            <div className="article__footer my-6 flex">
              <TagList post={post} />
            </div>
            <hr className="my-6" />
            <div className="w-full">
              <BlogInfo className="[&_.author\_\_image--container]:md:mb-0 [&_.author]:space-x-0 md:[&_.author]:space-x-4 md:[&_.author]:px-8 [&_img]:!size-[120px] md:[&_img]:!size-[80px]" />
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

        <section className="underconstruction hidden flex-auto flex-col lg:flex">
          <p>&nbsp;</p>
        </section>
      </div>
    </div>
  );
}
