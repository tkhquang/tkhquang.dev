import { MarkdownPost } from "@/models/markdown.types";
import { getOpeningWords, getProseStats } from "@/utils/prose";
import { format } from "date-fns";
import Link from "next/link";

/* Three dot-and-ring stars in the house magnitude grammar, the middle one
   a step larger and gilt: the asterism that closes the prose */
const AsterismTailpiece = () => (
  <div
    className="chapter-close__tailpiece"
    role="separator"
    aria-label="End of article"
  >
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
        <circle
          cx="16"
          cy="12"
          r="1.3"
          fill="var(--chart-star, var(--primary))"
        />
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
        <circle
          cx="80"
          cy="12"
          r="1.3"
          fill="var(--chart-star, var(--primary))"
        />
      </g>
    </svg>
  </div>
);

interface ChapterCloseProps {
  post: MarkdownPost;
  /* The page turn: a serial's adjacent instalments, or the shelf's
     chronological neighbours when the post carries no series */
  previousPost?: MarkdownPost;
  nextPost?: MarkdownPost;
  /* Kin by shared tags, and never a repeat of the panels or the rail */
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
  /* Seven words, per the approved copy: eight landed mid-name */
  const catchword = nextPost ? getOpeningWords(nextPost.content, 7) : "";
  const bothPanels = Boolean(previousPost && nextPost);
  /* A serial's first and last instalments turn only one page, and a lone
     post on its shelf turns none: the plate still stands on its rows */
  const anyPanel = Boolean(previousPost || nextPost);

  return (
    <>
      <AsterismTailpiece />
      <span className="kicker chapter-close__colophon">
        Set down {format(post.created_at, "d MMMM yyyy")} ·{" "}
        {new Intl.NumberFormat("en-US").format(words)} words · {minutes} min
        read
      </span>

      {(anyPanel || seeAlso.length > 0) && (
        <section className="chapter-close__plate" aria-label="Cross-references">
          <header className="chapter-close__head">
            <span className="kicker">Cross-references</span>
            <span className="kicker opacity-55">{contextLabel}</span>
          </header>
          {anyPanel && (
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
          )}
          {seeAlso.length > 0 && (
            <div
              className={
                anyPanel
                  ? "chapter-close__seealso"
                  : "chapter-close__seealso chapter-close__seealso--only"
              }
            >
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
                    <span className="kicker chapter-close__row-date opacity-55">
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
