import PostCard from "./PostCard";
import BlogPagination from "@/components/blog/BlogPagination";
import { MarkdownPost } from "@/models/markdown.types";

const FeedList = ({
  posts,
  totalPages,
}: {
  posts: MarkdownPost[];
  totalPages?: number;
}) => {
  return (
    <section className="news-feed w-full max-w-(--breakpoint-sm) flex-1">
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
