import PostCard from "./PostCard";
import BlogPagination from "@/components/blog/BlogPagination";
import CatalogueHeadpiece from "@/components/blog/CatalogueHeadpiece";
import { PathInfo } from "@/components/blog/PathInfo";
import { MarkdownPost } from "@/models/markdown.types";

const FeedList = <T,>({
  hideTitle,
  item,
  pathInfoType,
  pathSlug,
  posts,
  totalPages,
  currentPage,
  headpiece,
}: {
  pathSlug: string;
  posts: MarkdownPost[];
  pathInfoType: "category" | "tag" | undefined;
  item?: T;
  totalPages?: number;
  currentPage?: number;
  /* The list page headlines itself with the masthead instead */
  hideTitle?: boolean;
  /* Filtered pages open with the catalogue headpiece named after their
     subject; room and stat come from the route */
  headpiece?: {
    room: string;
    stat: string;
    hue?: string;
    hashed?: boolean;
    swatchLabel?: string;
  };
}) => {
  return (
    <section className="news-feed w-full max-w-(--breakpoint-sm) flex-1">
      {/* The headpiece IS the page's opening: the demo composition drops
          the breadcrumb-between-rules block wherever the room plate
          stands, so the subject never appears twice */}
      {pathInfoType && item && !headpiece && (
        <PathInfo<any, "slug">
          item={item}
          pathSlug={pathSlug}
          pathInfoType={pathInfoType}
          className="mx-auto"
        />
      )}
      {posts.length === 0 ? (
        <h1 className="flex-center mt-6 w-full text-2xl leading-7 font-bold sm:text-3xl sm:leading-9">
          This shelf awaits its first entry.
        </h1>
      ) : (
        <>
          {!hideTitle &&
            (headpiece ? (
              <div className="mt-4">
                <CatalogueHeadpiece
                  room={headpiece.room}
                  title={
                    (item as { title?: string } | undefined)?.title ?? ""
                  }
                  stat={headpiece.stat}
                  hue={headpiece.hue}
                  hashed={headpiece.hashed}
                  swatchLabel={headpiece.swatchLabel}
                />
              </div>
            ) : (
              <h1 className="text-theme-primary mx-auto text-2xl leading-7 font-bold sm:text-3xl sm:leading-9">
                {/* Filtered pages name their subject; only the unfiltered
                    feed falls back to the generic headline */}
                {(item as { title?: string } | undefined)?.title ??
                  "Latest Posts"}
              </h1>
            ))}
          <ul className="news-feed__list flex-center flex-col">
            {posts.map((post, index) => (
              <PostCard key={post.slug} post={post} index={index} />
            ))}
          </ul>

          <div className="my-6" />

          {totalPages && totalPages > 1 && (
            <BlogPagination totalPages={totalPages} />
          )}
        </>
      )}
    </section>
  );
};

export default FeedList;
