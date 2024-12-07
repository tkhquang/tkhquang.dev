import { GoogleAnalytics } from "@next/third-parties/google";

import "@/assets/styles/index.scss";

import { Main, Footer } from "@/components/layout";
import AppProvider from "@/providers/AppProvider";
import BackToTopButton from "@/components/layout/BackToTop";
import { Portal } from "@ariakit/react";
import BlogHeader from "@/components/layout/BlogHeader";

export default async function DefaultLayout({
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
