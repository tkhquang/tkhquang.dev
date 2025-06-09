import ViewCount from "@/components/common/ViewCount";
import { MarkdownPost } from "@/models/markdown.types";
import classNames from "classnames";
import { format, isValid } from "date-fns";
import React from "react";
import {
  // FaCalendarAlt,
  FaEye,
} from "react-icons/fa";

interface PostDatesProps extends React.ComponentProps<"div"> {
  post: MarkdownPost;
}

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
        "md:text-md grid grid-cols-[1fr_auto] items-end gap-2 text-xs font-semibold uppercase tracking-wider opacity-75 md:text-sm",
        className
      )}
    >
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1 text-theme-error">
        {/* <FaCalendarAlt className="size-3 shrink-0 md:size-4" /> */}
        <time className="align-middle" dateTime={post.created_at.toISOString()}>
          {created_at}
        </time>
        {updated_at && (
          <span className="align-middle">
            (Updated:{" "}
            <time dateTime={post.updated_at?.toISOString?.()}>
              {updated_at}
            </time>
            )
          </span>
        )}
      </div>

      <div className="text-muted-foreground flex items-center space-x-2 opacity-75">
        <FaEye className="inline-block size-3 align-text-bottom md:size-4" />
        <ViewCount pathname={`/blog/posts/${post.slug}`} />
      </div>
    </div>
  );
};

export default PostMeta;
