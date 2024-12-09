import classNames from "classnames";
import React from "react";
import Author from "@/components/blog/Author";
import CircuitBoard from "@/components/blog/CircuitBoard";
import HorizontalLine from "@/components/common/HorizontalLine";

const BlogInfo = ({ className }: React.ComponentProps<"section">) => {
  return (
    <section className={classNames("blog-info relative z-10", className)}>
      <div className="blog-info__content text-on-surface sticky rounded p-8 shadow-md">
        <div>
          <Author />
          <div className="my-5">
            <HorizontalLine />
          </div>
        </div>
        <div>
          <p className="mx-auto text-center">
            <strong>Get rekt!</strong>
            &nbsp;
            {`I'll send new posts to your inbox.`}
          </p>
          <div className="email-form flex-center relative flex w-full flex-wrap pt-5 text-center">
            <label htmlFor="email" className="absolute inset-0 z-bg opacity-0">
              Your email
            </label>
            <input
              id="email"
              className="input mb-5 h-10 w-full px-2"
              type="email"
              name="email"
              placeholder="your-email@address.ex"
              required
            />
            <button type="submit" className="button w-32" disabled>
              Subscribe
            </button>
          </div>
        </div>
        <CircuitBoard className="surface absolute inset-0 z-bg rounded shadow-md" />
      </div>
    </section>
  );
};

export default BlogInfo;
