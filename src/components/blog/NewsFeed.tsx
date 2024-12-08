import React from "react";
import BlogInfo from "@/components/blog/BlogInfo";
import FeedList from "@/components/blog/FeedList";
import { MarkdownPost } from "@/models/markdown.types";

const NewsFeed = ({ posts }: { posts: MarkdownPost[] }) => {
  return (
    <div className="relative mx-auto my-12 flex max-w-xl flex-wrap px-4 sm:px-6 lg:max-w-screen-xl lg:px-8">
      <FeedList posts={posts} />
      <BlogInfo className="mt-8 w-full lg:mt-4 lg:w-1/4" />
    </div>
  );
};

export default NewsFeed;
