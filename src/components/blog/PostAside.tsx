import { MarkdownPost } from "@/models/markdown.types";
import { format } from "date-fns";
import Link from "next/link";

interface PostAsideProps {
  categoryTitle: string;
  categorySlug: string;
  posts: MarkdownPost[];
}

/* Fills the article's right flank on wide screens */
const PostAside = ({ categorySlug, categoryTitle, posts }: PostAsideProps) => {
  return (
    <aside className="post-aside group hidden min-w-0 flex-1 flex-col pr-4 xl:flex">
      {posts.length > 0 && (
        /* A naked rail mirroring the TOC opposite: same sticky offset, same
           kicker header height, hairline rows instead of a card, and the
           same idle dim, resting at the 75 percent contrast floor the TOC
           documents and waking on hover anywhere in the flank */
        <div className="top-header-height sticky ml-4 w-full max-w-64 pt-5 transition-opacity duration-500 xl:opacity-75 xl:group-hover:opacity-100">
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
          {/* The kicker recipe minus its 85 percent ink: under the rail's
              idle dim the stacked opacities would land at 4.16, under the
              4.5 contrast floor, so this link keeps full ink like the post
              titles above it */}
          <Link
            href={`/blog/categories/${categorySlug}`}
            className="text-theme-primary mt-3 block font-mono text-xs font-semibold tracking-wider uppercase transition-opacity hover:opacity-75"
          >
            {`all ${categoryTitle} posts ->`}
          </Link>
        </div>
      )}
    </aside>
  );
};

export default PostAside;
