import React from "react";
import { format, isValid } from "date-fns";
import { PostsCollection } from "@/models/generated/markdown.types";
import classNames from "classnames";

interface PostDatesProps extends React.ComponentProps<"div"> {
  post: PostsCollection;
}

const PostMeta = ({ post, className }: PostDatesProps) => {
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
        "text-md font-semibold uppercase tracking-wider text-theme-error opacity-75",
        className
      )}
    >
      <time dateTime={post.created_at.toISOString()}>{created_at}</time>
      {updated_at && (
        <>
          &nbsp;(Updated:&nbsp;
          <time dateTime={post.updated_at?.toISOString()}>{updated_at}</time>)
        </>
      )}
    </div>
  );
};

export default PostMeta;
