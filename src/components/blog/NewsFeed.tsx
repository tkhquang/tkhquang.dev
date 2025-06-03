import React from "react";
import BlogInfo from "@/components/blog/BlogInfo";
import FeedList from "@/components/blog/FeedList";
import { MarkdownPost } from "@/models/markdown.types";

const NewsFeed = <T,>({
  item,
  pathInfoType,
  pathSlug,
  posts,
}: {
  posts: MarkdownPost[];
  pathInfoType?: "category" | "tag" | undefined;
  item?: T;
  pathSlug: string;
}) => {
  return (
    <div className="relative mx-auto my-12 flex max-w-xl flex-wrap px-4 sm:px-6 lg:max-w-screen-xl lg:px-8">
      <FeedList
        posts={posts}
        pathInfoType={pathInfoType}
        item={item}
        pathSlug={pathSlug}
      />
      <BlogInfo className="mt-8 w-full lg:mt-4 lg:w-1/4 [&_.author]:!flex-col [&_img]:!mb-8 [&_img]:!size-[150px]" />
    </div>
  );
};

export default NewsFeed;
