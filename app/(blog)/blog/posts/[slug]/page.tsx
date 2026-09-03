import BlogInfo from "@/components/blog/BlogInfo";
import ChapterClose from "@/components/blog/ChapterClose";
import Comments from "@/components/blog/Comments";
import { PathInfo } from "@/components/blog/PathInfo";
import PostAside from "@/components/blog/PostAside";
import PostMeta from "@/components/blog/PostMeta";
import TagList from "@/components/blog/PostTag";
import RailSky from "@/components/blog/RailSky";
import RailSkyDriver from "@/components/blog/RailSkyDriver";
import SeriesPlate from "@/components/blog/SeriesPlate";
import TableOfContent from "@/components/blog/TableOfContent";
import NextImage, { ImageProps } from "@/components/common/NextImage";
import ReportView from "@/components/common/ReportView";
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

/* Diagrams are typeset at press time (Chart Plates): no client mermaid,
   no CDN module, no deep-link anchor race to pin against */

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

  const allPosts = await markdownParser.getAllPosts();
  const categoryPosts = allPosts.filter(
    (other) =>
      other.category_slug === post.category_slug && other.slug !== post.slug
  );

  /* The full serial roster for the instalment plate under the lede */
  const seriesParts = post.series
    ? allPosts
        .filter((other) => other.series === post.series)
        .sort((a, b) => (a.series_part ?? 0) - (b.series_part ?? 0))
    : [];
  const seriesIndex = seriesParts.findIndex((part) => part.slug === post.slug);

  /* Serial continuity outranks recency: a reader finishing instalment N
     is offered instalment N+1 before the shelf's newest */
  const nextInSeries =
    seriesIndex >= 0 ? seriesParts[seriesIndex + 1] : undefined;
  const previousInSeries =
    seriesIndex > 0 ? seriesParts[seriesIndex - 1] : undefined;

  /* The rail's shelf rows stay pure recency; the next instalment gets
     its own pinned gilt block above them instead of masquerading as one */
  const relatedPosts = categoryPosts
    .filter((other) => other.slug !== nextInSeries?.slug)
    .slice(0, 3);

  /* The chapter close turns a page, it does not step through a timeline.
     A serial hands over its own adjacent instalments and stops at the
     serial's edges; everything else stays on its shelf. Walking the whole
     volume by date was the old behaviour, and it closed a devlog with
     whatever unrelated entry happened to be published next. */
  const previousPost = post.series
    ? previousInSeries
    : categoryPosts.find((other) => other.created_at < post.created_at);
  const nextPost = post.series
    ? nextInSeries
    : /* categoryPosts is bound newest-first, so the oldest entry newer
         than this one sits at the far end */
      [...categoryPosts]
        .reverse()
        .find((other) => other.created_at > post.created_at);

  /* See also gathers kin, not neighbours: the posts sharing the most tags
     with this one, minus everything the page already prints elsewhere (the
     two panels above, the serial roster under the lede, and the shelf rows
     in the right rail). Ties break to the newer entry. */
  const alreadyPrinted = new Set(
    [
      previousPost?.slug,
      nextPost?.slug,
      ...seriesParts.map((part) => part.slug),
      ...relatedPosts.map((other) => other.slug),
    ].filter((slug): slug is string => Boolean(slug))
  );

  const postTags = new Set(post.tags ?? []);
  const seeAlso = allPosts
    .filter(
      (other) => other.slug !== post.slug && !alreadyPrinted.has(other.slug)
    )
    .map((other) => ({
      other,
      shared: (other.tags ?? []).filter((tag) => postTags.has(tag)).length,
    }))
    .filter((entry) => entry.shared > 0)
    .sort(
      (a, b) =>
        b.shared - a.shared ||
        (a.other.created_at > b.other.created_at ? -1 : 1)
    )
    .slice(0, 3)
    .map((entry) => entry.other);

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
    /* 1280, not 1024: a 16:9 cover renders up to ~1280 CSS px wide under
       md:h-[50vw] md:max-h-[50vh] on large desktops, and the old cap
       upscaled the LCP image about 25 percent */
    sizes: "(max-width: 768px) 100vw, 1280px",
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
          section owns it, and both flanking rails consume it. The xl gap
          replaces the TOC's one-sided mx-4 so the two flex-1 flanks stay
          mirror images and the article sits on the true centerline. */}
      <div className="post-row flex xl:gap-4">
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
            {post.series && seriesParts.length > 1 && (
              <SeriesPlate
                series={post.series}
                parts={seriesParts}
                currentSlug={post.slug}
              />
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
            <ChapterClose
              post={post}
              previousPost={previousPost}
              nextPost={nextPost}
              seeAlso={seeAlso}
              contextLabel={
                post.series
                  ? `${category.title} · ${post.series}`
                  : category.title
              }
            />

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
            nextInstalment={nextInSeries}
          />
          <RailSky />
          <RailSkyDriver />
        </div>
      </div>
    </div>
  );
}
