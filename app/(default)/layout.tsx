import "@/assets/styles/index.scss";
import { Portal } from "@ariakit/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Footer, Header, Main } from "@/components/layout";
import BackToTopButton from "@/components/layout/BackToTop";
import AppProvider from "@/providers/AppProvider";

export default async function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <Header />
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
