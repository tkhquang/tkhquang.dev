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
        /* Sticky offset and top spacing mirror the TOC column opposite */
        <div className="top-header-height sticky ml-4 w-full max-w-64 pt-5">
          <div className="border-theme-hairline-soft bg-theme-raised mt-10 rounded-xl border p-4 shadow-sm">
            <span className="kicker mb-1 block">
              More from {categoryTitle}
            </span>
            <ol className="m-0 list-none p-0">
              {posts.map((post) => (
                <li
                  key={post.slug}
                  className="border-theme-hairline-soft border-b py-2.5 text-sm last:border-b-0"
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
              className="kicker text-theme-primary mt-2 block transition-opacity hover:opacity-75"
            >
              {`all ${categoryTitle} posts ->`}
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
};

export default PostAside;
