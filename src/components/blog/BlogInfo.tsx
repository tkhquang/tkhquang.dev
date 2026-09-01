import Author from "@/components/blog/Author";
import ConstellationChart from "@/components/blog/ConstellationChart";
import Subscribe from "@/components/blog/Subscribe";
import HorizontalLine from "@/components/common/HorizontalLine";
import classNames from "classnames";
import React from "react";

const BlogInfo = ({ className }: React.ComponentProps<"section">) => {
  return (
    <section className={classNames("blog-info relative text-sm", className)}>
      {/* The @container lets the chart pick its sky by card width: the
          same instance is a 240px rail on the desktop feed but a wide
          card on the post page and the narrow feed (inline-size
          containment leaves the sticky behavior alone) */}
      <div className="blog-info__content @container/blog-info text-theme-on-surface sticky rounded-sm px-4 py-8 shadow-md">
        <div className="[&_.author\_\_image--container]:mb-4">
          <Author />
          <div className="my-5">
            <HorizontalLine />
          </div>
        </div>
        <Subscribe />

        <ConstellationChart className="surface absolute inset-0 z-(--z-bg) rounded-sm shadow-md" />
      </div>
    </section>
  );
};

export default BlogInfo;
