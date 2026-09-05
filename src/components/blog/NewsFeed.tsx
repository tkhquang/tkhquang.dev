import BlogInfo from "@/components/blog/BlogInfo";
import CatalogueHeadpiece from "@/components/blog/CatalogueHeadpiece";
import FeedList from "@/components/blog/FeedList";
import { MarkdownPost } from "@/models/markdown.types";
import classNames from "classnames";

const NewsFeed = ({
  posts,
  totalPages,
  headpiece,
}: {
  posts: MarkdownPost[];
  totalPages?: number;
  /* Filtered pages open with the catalogue headpiece named after their
     subject; room, title and stat come from the route. The unfiltered
     feed passes none and is headlined by the masthead instead. */
  headpiece?: {
    room: string;
    title: string;
    stat: string;
    hue?: string;
    hashed?: boolean;
    swatchLabel?: string;
  };
}) => {
  return (
    <div
      className={classNames(
        "relative mx-auto flex max-w-xl flex-wrap px-4 sm:px-6 lg:max-w-(--breakpoint-xl) lg:space-x-16 lg:px-8",
        /* Filtered rooms open on the headpiece band, flush with the header;
           the unfiltered feed keeps its gap under the masthead */
        headpiece ? "mb-12" : "my-12"
      )}
    >
      {/* The wrap's first line, above FeedList's emptiness check on purpose:
          the headpiece is what names the page, so an empty shelf still says
          which shelf it is */}
      {headpiece && (
        <CatalogueHeadpiece
          room={headpiece.room}
          title={headpiece.title}
          stat={headpiece.stat}
          hue={headpiece.hue}
          hashed={headpiece.hashed}
          swatchLabel={headpiece.swatchLabel}
        />
      )}
      <FeedList posts={posts} totalPages={totalPages} />
      <BlogInfo className="mt-8 w-full lg:mt-4 lg:max-w-[240px] [&_.author]:mx-4! [&_.author]:flex-col! [&_img]:size-[120px]!" />
    </div>
  );
};

export default NewsFeed;
