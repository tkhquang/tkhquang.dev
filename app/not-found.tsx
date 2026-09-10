import "@/assets/styles/index.css";
import Image from "@/components/common/NextImage";
import ClientSideTracking from "@/components/container/ClientSideTracking";
import { Footer, Header, Main } from "@/components/layout";
import { Portfolio } from "@/constants/meta";
import { DEFAULT_LOCALE, getMessages } from "@/lib/i18n";
import AppProvider from "@/providers/AppProvider";
import { pageMetadata } from "@/utils/metadata";
import Link from "next/link";
import { Metadata } from "next/types";
import { Suspense } from "react";

/* Stated in full, with no url: without a card of its own a dead link unfurls
   as the landing page and reads as though it worked, and every unmatched URL
   on the site renders this same boundary, so there is no one address for it
   to claim. */
export const metadata: Metadata = pageMetadata({
  description:
    "Nothing lives at this address. Whatever you were after may have moved, and the post archive is one click away.",
  siteName: Portfolio.METADATA.title,
  title: "404 | Not Found",
});

/*
 * The one 404 for the whole site: every unmatched URL lands here with a
 * real 404 status, so no catch-all route is needed. Next serves this
 * boundary for anything no other route claims.
 */
export default async function NotFound() {
  return (
    <>
      <AppProvider
        locale={DEFAULT_LOCALE}
        messages={getMessages(DEFAULT_LOCALE)}
      >
        <Header useScroll={false} />
        <Main className="flex-1">
          <div className="typography mt-header-height container flex flex-1 flex-col">
            <div className="my-4 flex flex-1 flex-col md:my-8">
              <h1 className="text-theme-primary">
                Oops! We have looked everywhere...
              </h1>
              <p>
                But we couldn&apos;t find what you are looking for.
                <br />
                Don&apos;t worry, our{" "}
                <Link href="/blog/categories">post archive</Link> is full of
                hidden gems. Maybe your missing post is just playing
                hide-and-seek!
              </p>
              <div className="relative flex min-h-[200px] flex-1 flex-col items-center justify-center">
                <Image
                  src="/assets/resources/images/404-jim.gif"
                  alt="404"
                  fill
                />
              </div>
            </div>
          </div>
        </Main>
        <Footer />
      </AppProvider>
      <Suspense>
        <ClientSideTracking />
      </Suspense>
    </>
  );
}
