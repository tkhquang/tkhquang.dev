import PostCard from "./PostCard";
import { PathInfo } from "@/components/blog/PathInfo";
import { MarkdownPost } from "@/models/markdown.types";
import BlogPagination from "@/components/blog/BlogPagination";
import { ClientOnly } from "@/components/ui/client-only";

const FeedList = <T,>({
  item,
  pathInfoType,
  pathSlug,
  posts,
  totalPages,
  currentPage,
}: {
  pathSlug: string;
  posts: MarkdownPost[];
  pathInfoType: "category" | "tag" | undefined;
  item?: T;
  totalPages?: number;
  currentPage?: number;
}) => {
  const shouldShowEndOfResults = !currentPage || totalPages === currentPage;
  return (
    <section className="news-feed w-full max-w-(--breakpoint-sm) flex-1">
      {pathInfoType && item && (
        <PathInfo<any, "slug">
          item={item}
          pathSlug={pathSlug}
          pathInfoType={pathInfoType}
          className="mx-auto"
        />
      )}
      {posts.length === 0 ? (
        <h1 className="flex-center mt-6 w-full text-2xl leading-7 font-bold sm:text-3xl sm:leading-9">
          {`Sorry, there's nothing here`} :(
        </h1>
      ) : (
        <>
          <h1 className="mx-auto text-2xl leading-7 font-bold sm:text-3xl sm:leading-9">
            Latest Posts
          </h1>
          <ul className="news-feed__list flex-center flex-col">
            {posts.map((post, index) => (
              <PostCard key={post.slug} post={post} index={index} />
            ))}
          </ul>

          <h1 className="flex-center mx-auto my-6 w-full text-2xl leading-7 font-bold sm:text-3xl sm:leading-9">
            {shouldShowEndOfResults ? "End of Results" : ""}
          </h1>

          {totalPages && totalPages > 1 && (
            <ClientOnly>
              <BlogPagination totalPages={totalPages} />
            </ClientOnly>
          )}
        </>
      )}
    </section>
  );
};

export default FeedList;
