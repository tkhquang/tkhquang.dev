import ViewCount from "@/components/common/ViewCount";
import { MarkdownPost } from "@/models/markdown.types";
import classNames from "classnames";
import { format, isValid } from "date-fns";
import Link from "next/link";
import React from "react";
import {
  // FaCalendarAlt,
  FaEye,
} from "react-icons/fa";

interface PostDatesProps extends React.ComponentProps<"div"> {
  post: MarkdownPost;
}

/* Posts only store the slug; the display name is its title-cased form */
const categoryTitleFromSlug = (slug: string) =>
  slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const PostMeta = ({ className, post }: PostDatesProps) => {
  const formatDate = (date: Date): string | null => {
    if (!isValid(date)) {
      return null;
    }
    return format(date, "MMMM dd, yyyy");
  };

  const created_at = formatDate(post.created_at);
  const updated_at = post.updated_at ? formatDate(post.updated_at) : null;

  return (
    <div
      className={classNames(
        "grid grid-cols-[1fr_auto] items-end gap-2",
        className
      )}
    >
      <div className="kicker flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <time className="align-middle" dateTime={post.created_at.toISOString()}>
          {created_at}
        </time>
        {updated_at && (
          <span className="align-middle">
            · Updated:{" "}
            <time dateTime={post.updated_at?.toISOString?.()}>
              {updated_at}
            </time>
          </span>
        )}
        <span aria-hidden>·</span>
        {/* The layout-neutral padding/margin pair grows the tap target to
            the 24px floor (target-size); biased upward into the card's
            empty top padding so the extra area never overlaps the title */}
        <Link
          href={`/blog/categories/${post.category_slug}`}
          className="-mt-2 -mb-1 pt-2 pb-1 font-bold transition-opacity hover:opacity-75"
          style={{
            color: `var(--shelf-${post.category_slug}, var(--primary))`,
          }}
        >
          # {categoryTitleFromSlug(post.category_slug)}
        </Link>
      </div>

      <div className="text-theme-on-surface flex items-center space-x-2 font-mono text-xs opacity-75 md:text-sm">
        <FaEye className="inline-block size-3 align-text-bottom md:size-4" />
        <ViewCount pathname={`/blog/posts/${post.slug}`} />
      </div>
    </div>
  );
};

export default PostMeta;
