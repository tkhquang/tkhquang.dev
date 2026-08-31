import { Footer, Header, Main } from "@/components/layout";
import { Portfolio, Site } from "@/constants/meta";
import type { Metadata } from "next";

const description =
  "What I have been listening to on Spotify: the last 50 plays, plus my top tracks and artists over the last four weeks, six months and year.";
const title = `Music | ${Portfolio.METADATA.title}`;

export const metadata: Metadata = {
  description,
  openGraph: {
    description,
    // A nested `openGraph` replaces the root layout's wholesale, so the
    // default image has to be restated or /music ships no og:image.
    images: [{ url: Site.METADATA.coverImageUrl }],
    title,
  },
  title,
};

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
