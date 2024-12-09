import classNames from "classnames";
import Link from "next/link";
import React from "react";
import slugify from "slugify";
import { MarkdownPost } from "@/models/markdown.types";

interface TagListProps extends React.ComponentProps<"div"> {
  post: MarkdownPost;
}

const TagList = ({ className, post }: TagListProps) => {
  return (
    <ul className={classNames("tag-list inline-flex", className)}>
      {post.tags.map((tag) => (
        <li key={tag} className="tag-list__item flex">
          <Link
            href={`/blog/tags/${slugify(tag)}`}
            className="tag-list__item__link secondary mr-3 rounded-sm px-2 py-1 text-sm no-underline hover:shadow-inner"
          >
            # {tag}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default TagList;
