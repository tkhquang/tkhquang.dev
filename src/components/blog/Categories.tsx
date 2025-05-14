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
import { MarkdownCategory, MarkdownPost } from "@/models/markdown.types";

const Categories = ({
  categories,
  groupedPostsByCategorySlug,
  posts,
}: {
  categories: MarkdownCategory[];
  posts: MarkdownPost[];
  groupedPostsByCategorySlug: Record<string, MarkdownPost[]>;
}) => {
  return (
    <div className="flex-center relative mx-auto my-8 max-w-xl flex-wrap px-4 sm:px-6 lg:max-w-screen-xl lg:px-8">
      <section className="categories w-full self-start lg:w-3/4">
        <div className="mx-auto lg:w-4/5">
          <HorizontalLine className="mb-3 h-2px" />

          <h1 className="text-center text-2xl font-bold leading-7 sm:text-3xl sm:leading-9">
            Categories ({categories.length})
          </h1>

          <HorizontalLine className="mt-3 h-2px" />

          <Accordion type="multiple" className="my-8">
            {categories.map((category) => {
              return (
                <AccordionItem value={category.slug} key={category.slug}>
                  <AccordionTrigger>{category.title}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="post__list">
                      {groupedPostsByCategorySlug[category.slug].map((post) => {
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
                                className="font-mono"
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
      <BlogInfo className="w-full self-start lg:w-1/4" />
    </div>
  );
};

export default Categories;
