import Author from "@/components/blog/Author";
import CircuitBoard from "@/components/blog/CircuitBoard";
import Subscribe from "@/components/blog/Subscribe";
import HorizontalLine from "@/components/common/HorizontalLine";
import classNames from "classnames";
import React from "react";

const BlogInfo = ({ className }: React.ComponentProps<"section">) => {
  return (
    <section className={classNames("blog-info relative text-sm", className)}>
      <div className="blog-info__content text-on-surface sticky rounded px-4 py-8 shadow-md">
        <div className="[&_.author\_\_image--container]:mb-4">
          <Author />
          <div className="my-5">
            <HorizontalLine />
          </div>
        </div>
        <Subscribe />

        <CircuitBoard className="surface absolute inset-0 z-bg rounded shadow-md" />
      </div>
    </section>
  );
};

export default BlogInfo;
