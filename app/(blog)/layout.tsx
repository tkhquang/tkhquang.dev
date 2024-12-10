import "@/assets/styles/index.scss";
import { Portal } from "@ariakit/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Metadata } from "next/types";
import { Footer, Main } from "@/components/layout";
import BackToTopButton from "@/components/layout/BackToTop";
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
    <AppProvider>
      <BlogHeader />
      <Main className="flex-1">{children}</Main>
      <Footer />

      <Portal>
        <BackToTopButton />
      </Portal>

      <GoogleAnalytics
        gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID as string}
      />
    </AppProvider>
  );
}
