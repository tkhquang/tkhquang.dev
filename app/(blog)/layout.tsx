import "@/assets/styles/(blog)/index.css";
import ClientSideScrollRestorer from "@/components/container/ClientSideScrollRestorer";
import ClientSideTracking from "@/components/container/ClientSideTracking";
import { Main } from "@/components/layout";
import BackToTopButton from "@/components/layout/BackToTop";
import BlogFooter from "@/components/layout/BlogFooter";
import BlogHeader from "@/components/layout/BlogHeader";
import { Blog, Site } from "@/constants/meta";
import { DEFAULT_LOCALE, getMessages } from "@/lib/i18n";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import AppProvider from "@/providers/AppProvider";
import { getVolume } from "@/utils/volume";
import { Portal } from "@ariakit/react/portal";
import { Metadata } from "next/types";
import { Suspense } from "react";

export const metadata: Metadata = {
  alternates: {
    types: {
      "application/atom+xml": "/blog/feed.xml",
    },
  },
  description: Blog.METADATA.description,
  /* Without this block the segment inherits the root's whole openGraph
     object, so /blog and every index page unfurled as the portfolio card */
  openGraph: {
    description: Blog.METADATA.description,
    images: [
      {
        url: Site.METADATA.coverImageUrl,
      },
    ],
    title: Blog.METADATA.title.default,
    type: "website",
  },
  title: Blog.METADATA.title,
};

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* Counts for the phone Index drawer, frozen at build like the masthead
     stats; every deploy refreshes them */
  const markdownParser = await getMarkdownParser();
  const [posts, categories, tags] = await Promise.all([
    markdownParser.getAllPosts(),
    markdownParser.getAllCategories(),
    markdownParser.getAllTags(),
  ]);

  return (
    <>
      <AppProvider
        locale={DEFAULT_LOCALE}
        messages={getMessages(DEFAULT_LOCALE)}
      >
        {/* The Threshold Lamp: the first tab stop, revealed by opacity
            alone; tabindex on main lets focus really land in the text */}
        <a href="#main-content" className="skip-plate kicker">
          Skip to the text
        </a>
        <BlogHeader
          indexStats={{
            posts: posts.length,
            categories: categories.length,
            tags: tags.length,
            volume: getVolume(posts),
            year: new Date().getFullYear(),
          }}
        />
        {/* overflow-x-clip: the catalogue headpiece paints its band at 100vw,
            which under a classic scrollbar is half a scrollbar wider than
            the page; clip removes that without making main a scroll
            container, so the sticky bio card keeps pinning */}
        <Main id="main-content" tabIndex={-1} className="flex-1 overflow-x-clip">
          {children}
        </Main>
        <BlogFooter />

        <Suspense>
          <Portal>
            <BackToTopButton className="mr-10 mb-20" />
          </Portal>
        </Suspense>
      </AppProvider>
      <Suspense>
        <ClientSideScrollRestorer />
      </Suspense>
      <Suspense>
        <ClientSideTracking />
      </Suspense>
    </>
  );
}
