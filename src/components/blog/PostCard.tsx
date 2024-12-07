import PostMeta from "@/components/blog/PostMeta";
import TagList from "@/components/blog/PostTag";
import { PostsCollection } from "@/models/generated/markdown.types";
import React from "react";
import Image from "next/image";

interface PostCardProps {
  post: PostsCollection & { slug: string };
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const coverImage = post.cover_image ? `${post.cover_image}` : "";

  return (
    <li className="news-feed__list-item w-full pt-8 lg:w-4/5">
      <PostMeta className="news-feed__list-item__meta" post={post} />
      <h2 className="news-feed__list-item__title heading my-4 text-3xl hover:opacity-75 sm:text-4xl sm:leading-10">
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
            <Image
              alt="Cover image"
              className="news-feed__list-item__image mb-4 mt-2 rounded shadow-lg"
              src={coverImage}
              width="1280"
              height="720"
            />
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
