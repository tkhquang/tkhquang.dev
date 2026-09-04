import { MarkdownPost } from "@/models/markdown.types";
import { toRoman } from "@/utils/roman";
import { format } from "date-fns";
import Link from "next/link";

/* Serial furniture lists parts without their shared running prefix: a
   serial titled "[Devlog] Kingdom Come: Deliverance II - Customizing the
   View" reads as "Customizing the View" inside its own plate and rail,
   where the prefix already sits in the heading above. The short form is
   authored per post as short_title rather than cut out of the full title
   by rule, since no rule can tell a running prefix from a real one. */
export const serialDisplayTitle = (post: MarkdownPost) =>
  post.short_title?.trim() || post.title;

/* The four-point chart star that marks a serial: the instalment being read
   in this plate, the token on a feed card, the next instalment on the
   rail. Sizing and fill are the caller's, through CSS. */
export const SerialStar = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M12 1.8 C13.2 8.2 15.8 10.8 22.2 12 C15.8 13.2 13.2 15.8 12 22.2 C10.8 15.8 8.2 13.2 1.8 12 C8.2 10.8 10.8 8.2 12 1.8 Z" />
  </svg>
);

interface SeriesPlateProps {
  series: string;
  parts: MarkdownPost[];
  currentSlug: string;
}

/* The printed serial notice under a serial post's lede: every part as a
   ruled row, roman-numbered, the current one in gilt */
const SeriesPlate = ({ currentSlug, parts, series }: SeriesPlateProps) => {
  const currentIndex = parts.findIndex((part) => part.slug === currentSlug);
  if (currentIndex === -1) return null;

  return (
    <section className="series-plate" aria-label={`The ${series} serial`}>
      <div className="series-plate__head">
        <span className="kicker">
          {series} ·{" "}
          <span className="series-plate__instalment">
            Instalment {toRoman(currentIndex + 1)} of {toRoman(parts.length)}
          </span>
        </span>
      </div>
      <ol className="series-plate__rows">
        {parts.map((part, index) => {
          const isCurrent = part.slug === currentSlug;
          return (
            <li
              key={part.slug}
              className={
                isCurrent
                  ? "series-plate__row series-plate__row--current"
                  : "series-plate__row"
              }
            >
              <span className="series-plate__mark" aria-hidden>
                {isCurrent ? (
                  <SerialStar />
                ) : (
                  <span className="series-plate__ring" />
                )}
              </span>
              <span className="series-plate__numeral">
                {toRoman(index + 1)}.
              </span>
              {/* The cell is the grid item and the label stays inline
                  inside it, for two reasons: a grid item is blockified,
                  and the tint swell on a blockified link sizes to the
                  whole column instead of the words; and only an inline
                  box masks the leader running underneath line by line */}
              <span
                className="series-plate__title"
                {...(isCurrent ? { "aria-current": "page" as const } : {})}
              >
                {isCurrent ? (
                  <span className="series-plate__label">
                    {serialDisplayTitle(part)}
                  </span>
                ) : (
                  <Link
                    href={`/blog/posts/${part.slug}`}
                    className="series-plate__label tint-link"
                  >
                    {serialDisplayTitle(part)}
                  </Link>
                )}
              </span>
              <span className="series-plate__leader" aria-hidden />
              <span className="series-plate__date">
                {format(part.created_at, "MMM dd, yyyy")}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default SeriesPlate;
