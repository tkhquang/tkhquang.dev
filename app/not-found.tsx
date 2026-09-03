import "@/assets/styles/(blog)/index.css";
import Image from "@/components/common/NextImage";
import { Footer, Header, Main } from "@/components/layout";
import { DEFAULT_LOCALE, getMessages } from "@/lib/i18n";
import AppProvider from "@/providers/AppProvider";
import Link from "next/link";

/*
 * The one 404 for the whole site: a wrong path is a wrong path, so every
 * unmatched URL lands on Plate 404 in the library's shell with a real
 * 404 status. No catch-all routes needed; this boundary is what Next
 * serves for anything nothing else claims.
 */
export default async function NotFound() {
  return (
    <AppProvider locale={DEFAULT_LOCALE} messages={getMessages(DEFAULT_LOCALE)}>
      <Header useScroll={false} />
      <Main className="flex-1">
        <div className="typography mt-header-height container flex flex-1 flex-col">
          <div className="my-4 flex flex-1 flex-col md:my-8">
            <h1 className="text-theme-primary">
              Oops! We have looked everywhere...
            </h1>
            <p className="">
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
  );
}
