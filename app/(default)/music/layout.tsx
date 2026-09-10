import { Footer, Header, Main } from "@/components/layout";
import { Portfolio } from "@/constants/meta";
import { pageMetadata } from "@/utils/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  description:
    "What I have been listening to on Spotify: the last 50 plays, plus my top tracks and artists over the last four weeks, six months and year.",
  siteName: Portfolio.METADATA.title,
  title: `Music | ${Portfolio.METADATA.title}`,
  url: "/music",
});

export default async function MusicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* There is no hero on this route, so the header starts in its scrolled state. */}
      <Header useScroll={false} />
      <Main className="flex-1">{children}</Main>
      <Footer />
    </>
  );
}
