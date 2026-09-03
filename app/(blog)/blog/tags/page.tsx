import BlogInfo from "@/components/blog/BlogInfo";
import CatalogueHeadpiece from "@/components/blog/CatalogueHeadpiece";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { MarkdownPost } from "@/models/markdown.types";
import classNames from "classnames";
import Link from "next/link";
import { Metadata } from "next/types";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Tags",
};

export default async function TagsPage() {
  const markdownParser = await getMarkdownParser();
  const tags = await markdownParser.getAllTags();
  const posts = await markdownParser.getAllPosts();

  const groupedPostsByTagSlug = tags.reduce(
    (acc, tag) => {
      const filteredPosts = posts.filter((post) => {
        return post.tags.includes(tag.title);
      });

      return {
        ...acc,
        [tag.slug]: [...(acc[tag.slug] || []), ...filteredPosts],
      };
    },
    {} as Record<string, MarkdownPost[]>
  );

  /* Busiest first so the cloud reads as a ranking, not a lottery */
  const rankedTags = tags
    .map((tag) => ({
      ...tag,
      count: groupedPostsByTagSlug[tag.slug]?.length ?? 0,
    }))
    .filter((tag) => tag.count > 0)
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));

  return (
    <div className="relative mx-auto my-12 grid max-w-xl grid-cols-[1fr] px-4 sm:px-6 lg:max-w-(--breakpoint-xl) lg:grid-cols-[1fr_auto] lg:space-x-16 lg:px-8">
      <section className="w-full max-w-(--breakpoint-sm) lg:w-[640px]">
        <CatalogueHeadpiece
          room="The Index"
          title="Tags"
          stat={`${rankedTags.length} subjects · ranked by entries`}
        />

        <div className="my-8 flex flex-wrap gap-2">
          {rankedTags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/blog/tags/${tag.slug}`}
              className={classNames(
                "border-theme-hairline-soft bg-theme-raised text-theme-primary hover:border-theme-primary/40 hover:bg-theme-primary/10 rounded-md border px-2.5 py-1 font-mono font-semibold no-underline transition-colors",
                tag.count >= 3 ? "text-sm" : "text-xs"
              )}
            >
              # {tag.title}{" "}
              {/* 70 percent, not 60: at 60 the dark theme measures 3.98
                  to 1 on the raised chip, under the 4.5 contrast floor */}
              <span className="text-theme-on-surface opacity-70">
                · {tag.count}
              </span>
            </Link>
          ))}
        </div>
      </section>
      <BlogInfo className="mt-8 w-full lg:mt-4 lg:max-w-[240px] [&_.author]:mx-4! [&_.author]:flex-col! [&_img]:size-[120px]!" />
    </div>
  );
}
