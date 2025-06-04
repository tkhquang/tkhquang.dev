import Link from "next/link";
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
        <Link
          href={`/blog/posts/${post.slug}`}
          className="news-feed__list-item__link"
        >
          {post.title}
        </Link>
      </h2>
      {coverImage && (
        <figure>
          <Link
            href={`/blog/posts/${post.slug}`}
            className="news-feed__list-item__link"
          >
            <div className="relative mb-4 mt-2 aspect-[16/9] w-full">
              {post.renderCoverImage({
                alt: "",
                className:
                  "news-feed__list-item__image rounded shadow-lg bg-surface bg-cover bg-center bg-no-repeat",
                fill: true,
                height: undefined,
                style: {
                  backgroundImage: `linear-gradient(to top right, var(--secondary) 0%, var(--darken) 100%)`,
                  objectFit: "cover",
                  objectPosition: "center",
                },
                width: undefined,
              })}
            </div>
          </Link>
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
