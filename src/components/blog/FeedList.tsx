import React from "react";
import { PathInfo } from "@/components/blog/PathInfo";
import { MarkdownCategory, MarkdownPost } from "@/models/markdown.types";
import PostCard from "./PostCard";

const FeedList = <T,>({
  title,
  item,
  pathInfoType,
  posts,
  pathSlug,
}: {
  title: string;
  pathSlug: string;
  posts: MarkdownPost[];
  pathInfoType: "category" | "tag" | undefined;
  item?: T;
}) => {
  return (
    <section className="news-feed w-full lg:w-3/4">
      {pathInfoType && item && (
        <PathInfo<any, "slug"> item={item} title={title} pathSlug={pathSlug} />
      )}
      {posts.length === 0 ? (
        <h1 className="flex-center mt-6 w-full text-2xl font-bold leading-7 sm:text-3xl sm:leading-9">
          {`Sorry, there's nothing here`} :(
        </h1>
      ) : (
        <>
          <h1 className="mx-auto text-2xl font-bold leading-7 sm:text-3xl sm:leading-9 lg:w-4/5">
            Latest Posts
          </h1>
          <ul className="news-feed__list flex-center flex-col">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </ul>
          <h1 className="flex-center mx-auto my-6 w-full text-2xl font-bold leading-7 sm:text-3xl sm:leading-9 lg:w-4/5">
            End of Results
          </h1>
        </>
      )}
    </section>
  );
};

export default FeedList;
