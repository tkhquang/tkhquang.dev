import { Footer, Header, Main } from "@/components/layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
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
