import React from "react";
import PostMeta from "@/components/blog/PostMeta";
import TagList from "@/components/blog/PostTag";
import { MarkdownPost } from "@/models/markdown.types";

interface PostCardProps {
  post: MarkdownPost;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const coverImage = post.cover_image ? `${post.cover_image}` : "";

  return (
    <li className="news-feed__list-item w-full pt-8 lg:w-4/5">
      <PostMeta className="news-feed__list-item__meta" post={post} />
      <h2 className="news-feed__list-item__title heading my-4 text-xl hover:opacity-75 xs:text-2xl sm:text-4xl sm:leading-10">
        <a
          href={`/blog/posts/${post.slug}`}
          className="news-feed__list-item__link"
        >
          {post.title}
        </a>
      </h2>
      {coverImage && (
        <figure>
          <a
            href={`/blog/posts/${post.slug}`}
            className="news-feed__list-item__link"
          >
            {post.renderCoverImage({
              className:
                "news-feed__list-item__image mb-4 mt-2 rounded shadow-lg",
              height: "720",
              width: "1280",
            })}
          </a>
          <figcaption></figcaption>
        </figure>
      )}
      <p className="news-feed__list-item__description v-html mt-3 text-lg leading-7">
        {post.description}
      </p>
      <TagList className="news-feed__list-item__tags mt-3" post={post} />
      <hr className="-mb-3 mt-6" />
    </li>
  );
};

export default PostCard;
