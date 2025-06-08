import "@/assets/styles/index.scss";
import { Portal } from "@ariakit/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Metadata } from "next/types";
import { Suspense } from "react";
import ClientSideScrollRestorer from "@/components/container/ClientSideScrollRestorer";
import ClientSideTracking from "@/components/container/ClientSideTracking";
import { Main } from "@/components/layout";
import BackToTopButton from "@/components/layout/BackToTop";
import BlogFooter from "@/components/layout/BlogFooter";
import BlogHeader from "@/components/layout/BlogHeader";
import { Blog } from "@/constants/meta";
import AppProvider from "@/providers/AppProvider";

export const metadata: Metadata = {
  description: Blog.METADATA.description,
  other: {
    version: Date.now(),
  },
  title: Blog.METADATA.title,
};

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense>
        <ClientSideTracking />
      </Suspense>
      <AppProvider>
        <BlogHeader />
        <Main className="flex-1">{children}</Main>
        <BlogFooter />

        <Portal>
          <BackToTopButton />
        </Portal>

        <GoogleAnalytics
          gaId={
            process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID as string
          }
        />
        <Analytics />
        <SpeedInsights />
      </AppProvider>
      <Suspense>
        <ClientSideScrollRestorer />
      </Suspense>
    </>
  );
}
