import { Site } from "@/constants/meta";
import type { Metadata } from "next";

interface PageMetadataInput {
  /* Only a post passes these: they turn og:type into an article and hand the
     card the dates, byline, shelf and subjects the page itself prints */
  article?: {
    authors: string[];
    modifiedTime?: string;
    publishedTime: string;
    section?: string;
    tags?: string[];
  };
  /** One sentence on what this page holds, for the search result and the card */
  description: string;
  /** Root-relative; the root layout's `metadataBase` absolutises it */
  image?: string;
  /** The house, not the page: "Ljóss" for the blog, the portfolio elsewhere */
  siteName: string;
  /** The page's own name, which both the document title and the card take.
      Whatever house suffix each wants comes from its segment's template */
  title: string;
  /** Root-relative address of the page this card describes. Omitted only by
      the not-found boundary, which every unmatched URL renders and so has no
      address of its own to name */
  url?: string;
}

/**
 * Title, description and Open Graph card for one page, from one set of facts.
 *
 * `openGraph` is a nested field, and Next merges metadata shallowly: the
 * deepest segment that declares one replaces its parent's wholesale instead of
 * merging into it. A page that sets only `title` and `description` therefore
 * keeps its parent's entire card and unfurls as the section it sits in, which
 * is what routing every page through here prevents. The cost is that the image
 * has to be restated on every page, so it is defaulted here rather than
 * repeated.
 *
 * `title` is passed once because both templates are per-segment: the document
 * title picks up the segment's `title.template` and the card picks up its
 * `openGraph.title.template`, so one page name resolves into two suffixes.
 *
 * There is no `twitter` block to keep in sync. When a route declares none,
 * Next fills twitter:title, twitter:description and twitter:image from the
 * resolved `openGraph` and picks summary_large_image once an image is present,
 * so the card above is the only place a page states itself.
 */
export const pageMetadata = ({
  article,
  description,
  image = Site.METADATA.coverImageUrl,
  siteName,
  title,
  url,
}: PageMetadataInput): Metadata => {
  const card = {
    description,
    images: [{ url: image }],
    siteName,
    title,
    url,
  };

  return {
    description,
    openGraph: article
      ? { ...card, ...article, type: "article" }
      : { ...card, type: "website" },
    title,
  };
};
