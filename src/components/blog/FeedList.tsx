import PostCard from "./PostCard";
import BlogPagination from "@/components/blog/BlogPagination";
import CatalogueHeadpiece from "@/components/blog/CatalogueHeadpiece";
import { MarkdownPost } from "@/models/markdown.types";

const FeedList = <T,>({
  item,
  posts,
  totalPages,
  headpiece,
}: {
  posts: MarkdownPost[];
  item?: T;
  totalPages?: number;
  /* Filtered pages open with the catalogue headpiece named after their
     subject; room and stat come from the route. The unfiltered feed
     passes none and is headlined by the masthead instead. */
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
      {/* Above the emptiness check on purpose: the headpiece is what names
          the page, so an empty shelf still says which shelf it is */}
      {headpiece && (
        <div className="mt-4">
          <CatalogueHeadpiece
            room={headpiece.room}
            title={(item as { title?: string } | undefined)?.title ?? ""}
            stat={headpiece.stat}
            hue={headpiece.hue}
            hashed={headpiece.hashed}
            swatchLabel={headpiece.swatchLabel}
          />
        </div>
      )}
      {posts.length === 0 ? (
        <p className="flex-center mt-6 w-full text-lg leading-7">
          This shelf awaits its first entry.
        </p>
      ) : (
        <>
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
