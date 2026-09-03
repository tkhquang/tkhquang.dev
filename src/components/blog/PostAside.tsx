import { serialDisplayTitle } from "@/components/blog/SeriesPlate";
import { MarkdownPost } from "@/models/markdown.types";
import { toRoman } from "@/utils/roman";
import { format } from "date-fns";
import Link from "next/link";

interface PostAsideProps {
  categoryTitle: string;
  categorySlug: string;
  posts: MarkdownPost[];
  /* The serial's next part, pinned above the shelf rows in its own gilt
     grammar so continuity outranks recency */
  nextInstalment?: MarkdownPost;
}

/* Fills the article's right flank on wide screens */
const PostAside = ({
  categorySlug,
  categoryTitle,
  nextInstalment,
  posts,
}: PostAsideProps) => {
  return (
    <aside className="group hidden min-w-0 flex-1 flex-col pr-4 xl:flex">
      {(posts.length > 0 || nextInstalment) && (
        /* A naked rail mirroring the TOC opposite: same sticky offset, same
           kicker header height, hairline rows instead of a card, and the
           same idle dim, resting at the 75 percent contrast floor the TOC
           documents and waking on hover anywhere in the flank */
        <div className="top-header-height sticky ml-4 w-full max-w-64 pt-5 transition-opacity duration-500 xl:opacity-75 xl:group-hover:opacity-100">
          {nextInstalment && (
            <div className="mt-10 mb-6">
              <span
                className="kicker flex items-center gap-1.5"
                style={{ color: "var(--gilt-ink)", opacity: 1 }}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden
                  style={{ width: 10, height: 10, fill: "var(--gilt-ink)" }}
                >
                  <path d="M12 1.8 C13.2 8.2 15.8 10.8 22.2 12 C15.8 13.2 13.2 15.8 12 22.2 C10.8 15.8 8.2 13.2 1.8 12 C8.2 10.8 10.8 8.2 12 1.8 Z" />
                </svg>
                Next instalment
              </span>
              <div className="border-theme-hairline-soft mt-3 border-t border-b py-2.5 text-sm">
                <span className="kicker block text-[0.65rem]">
                  {nextInstalment.series_part
                    ? `Instalment ${toRoman(nextInstalment.series_part)} · `
                    : ""}
                  {format(nextInstalment.created_at, "MMM dd, yyyy")}
                </span>
                <Link
                  href={`/blog/posts/${nextInstalment.slug}`}
                  className="text-theme-primary leading-snug font-semibold transition-opacity hover:opacity-75"
                >
                  {serialDisplayTitle(nextInstalment.title)}
                </Link>
              </div>
            </div>
          )}
          {posts.length > 0 && (
            <span
              className={
                nextInstalment ? "kicker mb-1 block" : "kicker mt-10 mb-1 block"
              }
            >
              More from {categoryTitle}
            </span>
          )}
          <ol className="border-theme-hairline-soft m-0 mt-3 list-none border-t p-0">
            {posts.map((post) => (
              <li
                key={post.slug}
                className="border-theme-hairline-soft border-b py-2.5 text-sm"
              >
                <span className="kicker block text-[0.65rem]">
                  {format(post.created_at, "MMM dd, yyyy")}
                </span>
                <Link
                  href={`/blog/posts/${post.slug}`}
                  className="text-theme-primary leading-snug font-semibold transition-opacity hover:opacity-75"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ol>
          {/* The kicker recipe minus its 85 percent ink: under the rail's
              idle dim the stacked opacities would land at 4.16, under the
              4.5 contrast floor, so this link keeps full ink like the post
              titles above it */}
          <Link
            href={`/blog/categories/${categorySlug}`}
            className="text-theme-primary mt-3 block font-mono text-xs font-semibold tracking-wider uppercase transition-opacity hover:opacity-75"
          >
            {`all ${categoryTitle} posts ->`}
          </Link>
        </div>
      )}
    </aside>
  );
};

export default PostAside;
