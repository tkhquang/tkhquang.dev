import { MarkdownPost } from "@/models/markdown.types";
import { slugifyTag } from "@/utils/slug";
import classNames from "classnames";
import Link from "next/link";
import React from "react";

interface TagListProps extends React.ComponentProps<"div"> {
  post: MarkdownPost;
}

const TagList = ({ className, post }: TagListProps) => {
  return (
    <ul className={classNames("tag-list inline-flex flex-wrap", className)}>
      {post.tags.map((tag) => (
        <li key={tag} className="tag-list__item my-2 flex">
          <Link
            href={`/blog/tags/${slugifyTag(tag)}`}
            className="tag-list__item__link border-theme-hairline-soft bg-theme-raised text-theme-primary hover:border-theme-primary/40 hover:bg-theme-primary/10 mr-3 rounded-md border px-2 py-1 font-mono text-xs font-semibold no-underline transition-colors"
          >
            # {tag}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default TagList;
