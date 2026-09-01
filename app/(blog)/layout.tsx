import "@/assets/styles/(blog)/index.css";
import ClientSideScrollRestorer from "@/components/container/ClientSideScrollRestorer";
import ClientSideTracking from "@/components/container/ClientSideTracking";
import { Main } from "@/components/layout";
import BackToTopButton from "@/components/layout/BackToTop";
import BlogFooter from "@/components/layout/BlogFooter";
import BlogHeader from "@/components/layout/BlogHeader";
import { Blog } from "@/constants/meta";
import AppProvider from "@/providers/AppProvider";
import { Portal } from "@ariakit/react/portal";
import { Fraunces } from "next/font/google";
import { Metadata } from "next/types";
import { Suspense } from "react";

/* The wordmark face, declared here so it ships on blog routes only; the
   landing never pays for it. Next 16 dropped text subsetting, so the
   latin variable font loads whole, once, and caches. */
const fraunces = Fraunces({
  preload: true,
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  alternates: {
    types: {
      "application/atom+xml": "/blog/feed.xml",
    },
  },
  description: Blog.METADATA.description,
  title: Blog.METADATA.title,
};

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* display: contents keeps the body's flex column intact while the
          wrapper hands --font-fraunces down to the wordmark */}
      <AppProvider>
        <div className={`${fraunces.variable} contents`}>
          <BlogHeader />
          <Main className="flex-1">{children}</Main>
          <BlogFooter />
        </div>

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
