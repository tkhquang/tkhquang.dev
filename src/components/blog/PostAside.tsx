import { MarkdownPost } from "@/models/markdown.types";
import { format } from "date-fns";
import Link from "next/link";

interface PostAsideProps {
  categoryTitle: string;
  categorySlug: string;
  posts: MarkdownPost[];
}

/* Fills the article's right flank (formerly an empty spacer) on wide screens */
const PostAside = ({ categorySlug, categoryTitle, posts }: PostAsideProps) => {
  return (
    <aside className="post-aside hidden min-w-0 flex-1 flex-col pr-4 xl:flex">
      {posts.length > 0 && (
        /* A naked rail mirroring the TOC opposite: same sticky offset, same
           kicker header height, hairline rows instead of a card */
        <div className="top-header-height sticky ml-4 w-full max-w-64 pt-5">
          <span className="kicker mt-10 mb-1 block">
            More from {categoryTitle}
          </span>
          <ol className="border-theme-hairline-soft m-0 mt-3 list-none border-t p-0">
            {posts.map((post) => (
              <li
                key={post.slug}
                className="border-theme-hairline-soft border-b py-2.5 text-sm"
              >
                <span className="kicker block text-[0.65rem]">
                  {format(post.created_at, "MMM dd, yyyy")}
                </span>
                <Link
                  href={`/blog/posts/${post.slug}`}
                  className="text-theme-primary leading-snug font-semibold transition-opacity hover:opacity-75"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ol>
          <Link
            href={`/blog/categories/${categorySlug}`}
            className="kicker text-theme-primary mt-3 block transition-opacity hover:opacity-75"
          >
            {`all ${categoryTitle} posts ->`}
          </Link>
        </div>
      )}
    </aside>
  );
};

export default PostAside;
