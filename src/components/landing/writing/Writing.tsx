import NextImage from "@/components/common/NextImage";
import Reveal from "@/components/common/Reveal";
import SectionHeading from "@/components/common/SectionHeading";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { format } from "date-fns";
import Link from "next/link";

const POST_COUNT = 3;

/**
 * Latest from Ljóss: the blog finally visible from the front door, reusing
 * the blog's card grammar on a darken band.
 */
const Writing = async () => {
  const markdownParser = await getMarkdownParser();
  const allPosts = await markdownParser.getAllPosts();
  const posts = allPosts.slice(0, POST_COUNT);

  return (
    <section
      className="writing scroll-mt-header-height bg-theme-darken mt-16 py-16"
      id="writing"
    >
      <div className="container">
        <SectionHeading
          kicker="From the blog"
          title="Latest from Ljóss"
          emoji="✍️"
          intro="I keep a blog called Ljóss: devlogs, deep dives, and whatever I broke this month."
        />

        <Reveal className="grid gap-8 md:grid-cols-3 md:gap-6">
          {posts.map((post) => (
            <article key={post.slug} className="flex flex-col">
              {post.cover_image && (
                <Link
                  href={`/blog/posts/${post.slug}`}
                  aria-label={post.title}
                  className="block"
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-md">
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
                </Link>
              )}
              <span className="kicker mt-4">
                {format(post.created_at, "MMM dd, yyyy")}
              </span>
              <h3 className="m-0 mt-1 text-lg leading-snug font-bold">
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
        </Reveal>

        <Reveal className="mt-10" delay={100}>
          <Link
            href="/blog"
            className="border-theme-primary/50 text-theme-primary hover:border-theme-primary inline-flex items-center gap-1.5 rounded-lg border px-5 py-2.5 font-semibold transition-all duration-200 hover:-translate-y-0.5"
          >
            Visit the blog →
          </Link>
        </Reveal>
      </div>
    </section>
  );
};

export default Writing;
