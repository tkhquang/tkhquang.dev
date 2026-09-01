import Author from "@/components/blog/Author";
import ConstellationChart from "@/components/blog/ConstellationChart";
import Subscribe from "@/components/blog/Subscribe";
import HorizontalLine from "@/components/common/HorizontalLine";
import classNames from "classnames";
import React from "react";

interface BlogInfoProps extends React.ComponentProps<"section"> {
  /* rail: the 240px sidebar card, plate chart at lg and up; wide: the
     horizontal card (post page), always the outline-less sky. A container
     query would be the natural switch, but inline-size containment zeroes
     the card's intrinsic width and collapses the shrink-to-fit feed rows,
     so the variant is declared per callsite instead. */
  variant?: "rail" | "wide";
}

const BlogInfo = ({ className, variant = "rail" }: BlogInfoProps) => {
  return (
    <section className={classNames("blog-info relative text-sm", className)}>
      <div
        className={classNames(
          "blog-info__content text-theme-on-surface sticky rounded-sm px-4 py-8 shadow-md",
          variant === "rail"
            ? "blog-info__content--rail"
            : "blog-info__content--wide"
        )}
      >
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
