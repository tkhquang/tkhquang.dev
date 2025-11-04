import PostMeta from "@/components/blog/PostMeta";
import TagList from "@/components/blog/PostTag";
import NextImage, { ImageProps } from "@/components/common/NextImage";
import { MarkdownPost } from "@/models/markdown.types";
import Link from "next/link";
import React from "react";

interface PostCardProps {
  post: MarkdownPost;
  index: number;
}

const PostCard = ({ index, post }: PostCardProps) => {
  const coverImage = post.cover_image ? `${post.cover_image}` : "";

  const coverProps: Partial<ImageProps> = {
    alt: "",
    className: "news-feed__list-item__image rounded-sm shadow-lg",
    containerClassName: "",
    fill: true,
    height: undefined,
    style: {
      objectFit: "cover",
      objectPosition: "center",
    },
    width: undefined,
    ...(index === 0
      ? {
          loading: "eager",
          priority: true,
        }
      : {}),
  };

  return (
    <li className="news-feed__list-item w-full pt-8" id={post.slug}>
      <PostMeta className="news-feed__list-item__meta" post={post} />
      <Link
        href={`/blog/posts/${post.slug}`}
        className="news-feed__list-item__link inline"
      >
        <h2 className="news-feed__list-item__title heading mb-4 mt-1 inline text-xl hover:opacity-75 xs:text-2xl sm:text-3xl sm:leading-10">
          {post.title}
        </h2>
      </Link>

      {coverImage && (
        <figure>
          <Link
            href={`/blog/posts/${post.slug}`}
            className="news-feed__list-item__link"
            aria-label={post.title}
          >
            <div className="relative mb-4 mt-2 aspect-video w-full">
              <NextImage {...post.coverData} {...coverProps} />
            </div>
          </Link>
          <figcaption></figcaption>
        </figure>
      )}
      <p className="news-feed__list-item__description text-md mt-3 leading-7">
        {post.description}
      </p>
      <TagList className="news-feed__list-item__tags mt-3" post={post} />
      <hr className="-mb-3 mt-6" />
    </li>
  );
};

export default PostCard;
