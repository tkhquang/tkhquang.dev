import { format } from "date-fns";
import Link from "next/link";
import React from "react";
import BlogInfo from "@/components/blog/BlogInfo";
import HorizontalLine from "@/components/common/HorizontalLine";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MarkdownPost } from "@/models/markdown.types";

const PostList = <
  T extends { title: string; slug: string },
  K extends keyof T,
>({
  groupedPostsBySlug,
  list,
  listSlugField = "slug" as K,
  title,
}: {
  title: string;
  list: T[];
  groupedPostsBySlug: Record<string, MarkdownPost[]>;
  listSlugField?: K;
}) => {
  return (
    <div className="flex-center relative mx-auto my-8 max-w-xl flex-wrap px-4 sm:px-6 lg:max-w-screen-xl lg:px-8">
      <section className="list w-full self-start lg:w-3/4">
        <div className="mx-auto lg:w-4/5">
          <HorizontalLine className="mb-3 h-2px" />

          <h1 className="text-center text-2xl font-bold leading-7 sm:text-3xl sm:leading-9">
            {title} ({list.length})
          </h1>

          <HorizontalLine className="mt-3 h-2px" />

          <Accordion type="multiple" className="my-8">
            {list.map((item) => {
              const fieldSlug = item[listSlugField] as string;

              return (
                <AccordionItem value={fieldSlug} key={fieldSlug}>
                  <AccordionTrigger>{item.title}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="post__list">
                      {groupedPostsBySlug[fieldSlug].map((post) => {
                        return (
                          <li
                            className="post__item mb-2 grid gap-4 truncate rounded p-2 transition duration-500 hover:bg-theme-secondary hover:text-theme-on-secondary"
                            key={post.slug}
                          >
                            <Link
                              className="link space-x-2 truncate"
                              href={`/blog/posts/${post.slug}`}
                              title={post.description}
                            >
                              <time
                                className="space-x-2 font-mono"
                                dateTime={post.created_at.toISOString()}
                              >
                                <span className="hidden md:inline">
                                  {format(post.created_at, "HH:mm")}
                                </span>
                                <span>
                                  {format(post.created_at, "dd/MM/yyyy")}
                                </span>
                              </time>
                              <span>{post.title}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </section>
      <BlogInfo className="w-full self-start lg:w-1/4 [&_.author]:!flex-col [&_img]:!size-[150px]" />
    </div>
  );
};

export default PostList;
