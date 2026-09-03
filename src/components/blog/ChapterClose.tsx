import { MarkdownPost } from "@/models/markdown.types";
import { getOpeningWords, getProseStats } from "@/utils/prose";
import { format } from "date-fns";
import Link from "next/link";

/* Three dot-and-ring stars in the house magnitude grammar, the middle one
   a step larger and gilt: the asterism that closes the prose */
const AsterismTailpiece = () => (
  <div className="chapter-close__tailpiece" role="separator">
    <svg width="96" height="24" viewBox="0 0 96 24" aria-hidden>
      <g fill="none">
        <circle
          cx="16"
          cy="12"
          r="3"
          stroke="var(--chart-star, var(--primary))"
          strokeWidth="0.75"
          opacity="0.5"
        />
        <circle cx="16" cy="12" r="1.3" fill="var(--chart-star, var(--primary))" />
        <circle
          cx="48"
          cy="12"
          r="4.2"
          stroke="var(--gilt-ink)"
          strokeWidth="0.75"
          opacity="0.6"
        />
        <circle cx="48" cy="12" r="1.9" fill="var(--gilt-ink)" />
        <circle
          cx="80"
          cy="12"
          r="3"
          stroke="var(--chart-star, var(--primary))"
          strokeWidth="0.75"
          opacity="0.5"
        />
        <circle cx="80" cy="12" r="1.3" fill="var(--chart-star, var(--primary))" />
      </g>
    </svg>
  </div>
);

interface ChapterCloseProps {
  post: MarkdownPost;
  /* Chronological neighbors across the whole volume: next is the newer */
  previousPost?: MarkdownPost;
  nextPost?: MarkdownPost;
  /* Same-shelf rows shown only below xl, where the right rail is absent */
  seeAlso: MarkdownPost[];
  /* Right head badge: the serial's name, or the shelf's */
  contextLabel: string;
}

const ChapterClose = ({
  contextLabel,
  nextPost,
  post,
  previousPost,
  seeAlso,
}: ChapterCloseProps) => {
  const { minutes, words } = getProseStats(post.content);
  const catchword = nextPost ? getOpeningWords(nextPost.content, 8) : "";
  const bothPanels = Boolean(previousPost && nextPost);

  return (
    <>
      <AsterismTailpiece />
      <span className="kicker chapter-close__colophon">
        Set down {format(post.created_at, "d MMMM yyyy")} ·{" "}
        {new Intl.NumberFormat("en-US").format(words)} words · {minutes} min
        read
      </span>

      {(previousPost || nextPost) && (
        <section className="chapter-close__plate" aria-label="Cross-references">
          <header className="chapter-close__head">
            <span className="kicker">Cross-references</span>
            <span className="kicker opacity-55">{contextLabel}</span>
          </header>
          <div
            className={
              bothPanels
                ? "chapter-close__spread"
                : "chapter-close__spread chapter-close__spread--single"
            }
          >
            {previousPost && (
              <div className="chapter-close__panel">
                <div className="chapter-close__meta">
                  <span className="kicker">Previous entry</span>
                  <span className="kicker opacity-55">
                    {format(previousPost.created_at, "MMM dd, yyyy")}
                  </span>
                </div>
                <h3 className="chapter-close__title">
                  <Link
                    href={`/blog/posts/${previousPost.slug}`}
                    className="tint-link"
                  >
                    {previousPost.title}
                  </Link>
                </h3>
              </div>
            )}
            {nextPost && (
              <div
                className={
                  bothPanels
                    ? "chapter-close__panel chapter-close__panel--next"
                    : "chapter-close__panel"
                }
              >
                <div className="chapter-close__meta">
                  <span className="kicker">Next entry</span>
                  <span className="kicker opacity-55">
                    {format(nextPost.created_at, "MMM dd, yyyy")}
                  </span>
                </div>
                <h3 className="chapter-close__title">
                  <Link
                    href={`/blog/posts/${nextPost.slug}`}
                    className="tint-link"
                  >
                    {nextPost.title}
                  </Link>
                </h3>
                {catchword && (
                  <p className="chapter-close__catchword">
                    {catchword}&nbsp;&hellip;
                  </p>
                )}
              </div>
            )}
          </div>
          {seeAlso.length > 0 && (
            <div className="chapter-close__seealso xl:hidden">
              <span className="kicker">See also</span>
              <ol className="chapter-close__rows">
                {seeAlso.map((other) => (
                  <li key={other.slug} className="chapter-close__row">
                    <span className="chapter-close__row-title">
                      <Link
                        href={`/blog/posts/${other.slug}`}
                        className="tint-link"
                      >
                        {other.title}
                      </Link>
                    </span>
                    <span className="kicker opacity-55 chapter-close__row-date">
                      {format(other.created_at, "MMM dd, yyyy")}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}
    </>
  );
};

export default ChapterClose;
