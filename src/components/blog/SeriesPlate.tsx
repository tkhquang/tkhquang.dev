import { MarkdownPost } from "@/models/markdown.types";
import { toRoman } from "@/utils/roman";
import { format } from "date-fns";
import Link from "next/link";

/* Serial furniture lists parts without their shared running prefix: a
   serial titled "[Devlog] Kingdom Come: Deliverance II - Customizing the
   View" reads as "Customizing the View" inside its own plate and rail */
export const serialDisplayTitle = (title: string) => {
  if (!title.startsWith("[")) return title;
  const separatorAt = title.indexOf(" - ");
  return separatorAt === -1 ? title : title.slice(separatorAt + 3);
};

/* The four-point chart star that marks the instalment being read */
const CurrentMark = () => (
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
                  <CurrentMark />
                ) : (
                  <span className="series-plate__ring" />
                )}
              </span>
              <span className="series-plate__numeral">
                {toRoman(index + 1)}.
              </span>
              {isCurrent ? (
                <span className="series-plate__title" aria-current="page">
                  {serialDisplayTitle(part.title)}
                </span>
              ) : (
                <Link
                  href={`/blog/posts/${part.slug}`}
                  className="series-plate__title tint-link"
                >
                  {serialDisplayTitle(part.title)}
                </Link>
              )}
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
