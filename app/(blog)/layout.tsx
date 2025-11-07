import "@/assets/styles/(blog)/index.css";
import ClientSideScrollRestorer from "@/components/container/ClientSideScrollRestorer";
import ClientSideTracking from "@/components/container/ClientSideTracking";
import { Main } from "@/components/layout";
import BackToTopButton from "@/components/layout/BackToTop";
import BlogFooter from "@/components/layout/BlogFooter";
import BlogHeader from "@/components/layout/BlogHeader";
import { Blog } from "@/constants/meta";
import AppProvider from "@/providers/AppProvider";
import { Portal } from "@ariakit/react";
import { Metadata } from "next/types";
import { Suspense } from "react";

export const metadata: Metadata = {
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
      <AppProvider>
        <BlogHeader />
        <Main className="flex-1">{children}</Main>
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
