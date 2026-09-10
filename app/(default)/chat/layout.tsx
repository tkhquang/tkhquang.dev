import { Footer, Header, Main } from "@/components/layout";
import { Portfolio } from "@/constants/meta";
import { pageMetadata } from "@/utils/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...pageMetadata({
    description:
      "A small public room on the site. Sign in to post, or read along without an account.",
    siteName: Portfolio.METADATA.title,
    title: `Chat | ${Portfolio.METADATA.title}`,
    url: "/chat",
  }),
  /* Kept out of search results, but it still needs a card of its own: the
     room is linked and shared by hand, and without one it unfurls as the
     portfolio landing page */
  robots: "noindex, nofollow, noarchive, nosnippet",
};

export default async function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header useScroll={false} />
      <Main className="flex-1">{children}</Main>
      <Footer />
    </>
  );
}
