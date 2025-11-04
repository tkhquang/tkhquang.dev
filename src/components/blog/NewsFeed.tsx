import BlogInfo from "@/components/blog/BlogInfo";
import FeedList from "@/components/blog/FeedList";
import { MarkdownPost } from "@/models/markdown.types";
import React from "react";

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
    <div className="relative mx-auto my-12 flex max-w-xl flex-wrap px-4 sm:px-6 lg:max-w-(--breakpoint-xl) lg:space-x-16 lg:px-8">
      <FeedList
        posts={posts}
        pathInfoType={pathInfoType}
        item={item}
        pathSlug={pathSlug}
      />
      <BlogInfo className="mt-8 w-full lg:mt-4 lg:max-w-[240px] [&_.author]:mx-4! [&_.author]:flex-col! [&_img]:size-[120px]!" />
    </div>
  );
};

export default NewsFeed;
