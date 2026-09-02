import BlogInfo from "@/components/blog/BlogInfo";
import HorizontalLine from "@/components/common/HorizontalLine";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { intl } from "@/lib/intl";
import { MarkdownPost } from "@/models/markdown.types";
import { format } from "date-fns";
import Link from "next/link";
import React from "react";

const PostList = <
  T extends { title: string; slug: string },
  K extends keyof T,
>({
  groupedPostsBySlug,
  list,
  listSlugField = "slug" as K,
  title,
  count = list.length,
  defaultOpen,
}: {
  title: string;
  list: T[];
  groupedPostsBySlug: Record<string, MarkdownPost[]>;
  listSlugField?: K;
  /* The archive headlines its post total, not its group count */
  count?: number;
  defaultOpen?: string[];
}) => {
  return (
    <div className="relative mx-auto my-12 grid max-w-xl grid-cols-[1fr] px-4 sm:px-6 lg:max-w-(--breakpoint-xl) lg:grid-cols-[1fr_auto] lg:space-x-16 lg:px-8">
      <section className="w-full max-w-(--breakpoint-sm) lg:w-[640px]">
        <HorizontalLine className="h-2px mb-3" />

        <h1 className="text-center text-2xl leading-7 font-bold sm:text-3xl sm:leading-9">
          {title} ({count})
        </h1>

        <HorizontalLine className="h-2px mt-3" />

        <Accordion type="multiple" className="my-8" defaultValue={defaultOpen}>
          {list.map((item) => {
            const fieldSlug = item[listSlugField] as string;
            const postCount = groupedPostsBySlug[fieldSlug]?.length ?? 0;

            return (
              <AccordionItem value={fieldSlug} key={fieldSlug}>
                <AccordionTrigger>
                  <span className="flex flex-1 items-baseline justify-between gap-4">
                    <span>{item.title}</span>
                    <span className="kicker tabular-nums">
                      {intl.formatMessage(
                        { id: "postCount" },
                        { count: postCount }
                      )}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="post__list">
                    {(groupedPostsBySlug[fieldSlug] ?? []).map((post) => {
                      return (
                        <li
                          className="post__item hover:bg-theme-secondary hover:text-theme-on-secondary mb-2 grid gap-4 truncate rounded-sm p-2 transition duration-500"
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
      </section>
      <BlogInfo className="mt-8 w-full lg:mt-4 lg:max-w-[240px] [&_.author]:mx-4! [&_.author]:flex-col! [&_img]:size-[120px]!" />
    </div>
  );
};

export default PostList;
