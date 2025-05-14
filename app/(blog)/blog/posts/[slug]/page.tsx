import { Metadata } from "next/types";
import BlogInfo from "@/components/blog/BlogInfo";
import { PathInfo } from "@/components/blog/PathInfo";
import PostMeta from "@/components/blog/PostMeta";
import TagList from "@/components/blog/PostTag";
import { Site } from "@/constants/meta";

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
        <section className="table-of-content fixed bottom-0 left-0 z-fg mx-4 flex flex-1 flex-col items-end font-bold transition-opacity duration-500 lg:relative lg:opacity-50 lg:hover:opacity-100">
          {headings?.length! > 0 && (
            <div className="table-of-content__list sticky top-0 mt-header-height hidden pt-header-height lg:block">
              <h2 className="heading mt-10 text-2xl">Table of Content</h2>
              <ul className="mt-5">
                {headings!.map((heading: any) => (
                  <li key={heading.id} className="my-2">
                    <a
                      href={`#${heading.id}`}
                      className={`anchor hover:text-theme-primary ${
                        activeAnchor === heading.id ? "anchor--is-active" : ""
                      }`}
                    >
                      <span>#</span>&nbsp;
                      <span>{heading.value}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="container !max-w-screen-md">
          <article className="article">
            {/* Replace below components with actual React equivalents */}
            <div className="article__meta mb-6 mt-3">
              <PostMeta post={post} />
            </div>
            <div className="article__path-info">
              <PathInfo category={category} />
            </div>

            <div className="article__content typography">{html}</div>

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
