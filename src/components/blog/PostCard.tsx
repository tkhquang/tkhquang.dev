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
    sizes: "(max-width: 640px) 100vw, 640px",
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
        <h2 className="news-feed__list-item__title heading xs:text-2xl mt-1 mb-4 inline-block text-xl hover:opacity-75 sm:text-3xl sm:leading-10">
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
            <div className="relative mt-2 mb-4 aspect-video w-full">
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
      <hr className="mt-6 -mb-3" />
    </li>
  );
};

export default PostCard;
