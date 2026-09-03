import NextImage from "@/components/common/NextImage";
import SectionHeading from "@/components/common/SectionHeading";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { format } from "date-fns";
import Link from "next/link";

const POST_COUNT = 3;
const MORE_COUNT = 3;

/* Only technical writing on the front door; personal posts stay on the blog */
const FEATURED_CATEGORY = "technical";

/** Blog teaser: the latest technical posts in the blog's card grammar */
const Writing = async () => {
  const markdownParser = await getMarkdownParser();
  const allPosts = await markdownParser.getAllPosts();
  const technicalPosts = allPosts.filter(
    (post) => post.category_slug === FEATURED_CATEGORY
  );
  const posts = technicalPosts.slice(0, POST_COUNT);
  const morePosts = technicalPosts.slice(POST_COUNT, POST_COUNT + MORE_COUNT);

  return (
    <section
      className="writing scroll-mt-header-height bg-theme-darken mt-16 py-16"
      id="writing"
    >
      <div className="container">
        <SectionHeading
          kicker="From the blog"
          title={
            <span>
              Latest from <span className="writing__blog-title">Ljóss</span>
            </span>
          }
          emoji="✍️"
          intro="I keep a blog called Ljóss: devlogs, deep dives, and whatever I broke this month."
        />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          {posts.map((post) => (
            <article key={post.slug} className="flex flex-col">
              <Link
                href={`/blog/posts/${post.slug}`}
                aria-label={post.title}
                className="block"
              >
                {post.cover_image ? (
                  <div className="border-theme-hairline-soft relative aspect-video w-full overflow-hidden rounded-lg border shadow-md">
                    <NextImage
                      {...post.coverData}
                      fill
                      width={undefined}
                      height={undefined}
                      alt=""
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{
                        objectFit: "cover",
                        objectPosition: "center",
                      }}
                    />
                  </div>
                ) : (
                  /* Coverless posts get a bookplate in the same frame so
                     the cover row never collapses and the grid stays
                     aligned */
                  <div className="band border-theme-hairline-soft flex-center aspect-video w-full rounded-lg border shadow-md">
                    <span
                      className="writing__bookplate-mark"
                      aria-hidden="true"
                    >
                      Ljóss
                    </span>
                  </div>
                )}
              </Link>
              <span className="kicker mt-4">
                {format(post.created_at, "MMM dd, yyyy")}
              </span>
              {/* Two reserved lines, clamped, only while the cards sit in
                  one row: descriptions start on the same row across the
                  three cards no matter the title length. Stacked on mobile
                  there is nothing to align, so titles run free */}
              <h3 className="m-0 mt-1 text-lg leading-snug font-bold md:line-clamp-2 md:min-h-[2.75em]">
                <Link
                  href={`/blog/posts/${post.slug}`}
                  className="text-theme-primary transition-opacity hover:opacity-75"
                >
                  {post.title}
                </Link>
              </h3>
              <p className="mt-2 mb-0 line-clamp-2 text-sm opacity-80">
                {post.description}
              </p>
            </article>
          ))}
        </div>

        {morePosts.length > 0 && (
          <div className="border-theme-hairline-soft mt-10 border-t">
            {morePosts.map((post) => (
              <div
                key={post.slug}
                className="border-theme-hairline-soft border-b py-4"
              >
                <span className="kicker block">
                  {format(post.created_at, "MMM dd, yyyy")}
                </span>
                <h3 className="m-0 mt-0.5 text-base leading-snug font-bold">
                  <Link
                    href={`/blog/posts/${post.slug}`}
                    className="text-theme-primary transition-opacity hover:opacity-75"
                  >
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-1 mb-0 line-clamp-1 text-sm opacity-75">
                  {post.description}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10">
          <Link
            href="/blog"
            className="border-theme-primary/50 text-theme-primary hover:border-theme-primary hover:bg-theme-primary/10 inline-flex items-center gap-1.5 rounded-lg border px-5 py-2.5 font-semibold transition-all duration-200"
          >
            Visit the blog →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Writing;
