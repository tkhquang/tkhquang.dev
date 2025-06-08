import "@/assets/styles/index.scss";
import { Portal } from "@ariakit/react";
import { Suspense } from "react";
import ClientSideTracking from "@/components/container/ClientSideTracking";
import { Footer, Header, Main } from "@/components/layout";
import BackToTopButton from "@/components/layout/BackToTop";
import AppProvider from "@/providers/AppProvider";

export default async function DefaultLayout({
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
        <Header />
        <Main className="flex-1">{children}</Main>
        <Footer />

        <Suspense>
          <Portal>
            <BackToTopButton />
          </Portal>
        </Suspense>
      </AppProvider>
    </>
  );
}
