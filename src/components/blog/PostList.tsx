import BlogInfo from "@/components/blog/BlogInfo";
import CatalogueHeadpiece from "@/components/blog/CatalogueHeadpiece";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { getIntl } from "@/lib/intl";
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
  room,
  stat,
  getItemHue,
  defaultOpen,
}: {
  title: string;
  /* Catalogue headpiece copy: the library room and its stat line */
  room: string;
  stat: string;
  list: T[];
  groupedPostsBySlug: Record<string, MarkdownPost[]>;
  listSlugField?: K;
  /* Shelf ribbons: a hue per item slug (the Categories page); the archive
     years stay in plain ink */
  getItemHue?: (slug: string) => string | undefined;
  defaultOpen?: string[];
}) => {
  const intl = getIntl(DEFAULT_LOCALE);

  return (
    <div className="relative mx-auto my-12 grid max-w-xl grid-cols-[1fr] px-4 sm:px-6 lg:max-w-(--breakpoint-xl) lg:grid-cols-[1fr_auto] lg:space-x-16 lg:px-8">
      <section className="w-full max-w-(--breakpoint-sm) lg:w-[640px]">
        <CatalogueHeadpiece room={room} title={title} stat={stat} />

        <Accordion type="multiple" className="my-8" defaultValue={defaultOpen}>
          {list.map((item) => {
            const fieldSlug = item[listSlugField] as string;
            const postCount = groupedPostsBySlug[fieldSlug]?.length ?? 0;
            const hue = getItemHue?.(fieldSlug);

            return (
              <AccordionItem
                value={fieldSlug}
                key={fieldSlug}
                style={
                  hue
                    ? {
                        borderBottomColor: `color-mix(in srgb, ${hue} 35%, transparent)`,
                      }
                    : undefined
                }
              >
                <AccordionTrigger>
                  <span className="flex flex-1 items-baseline justify-between gap-4">
                    <span
                      className={hue ? "font-semibold" : undefined}
                      style={hue ? { color: hue } : undefined}
                    >
                      {item.title}
                    </span>
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
                              className="font-mono"
                              dateTime={post.created_at.toISOString()}
                            >
                              {format(post.created_at, "dd/MM/yyyy")}
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
