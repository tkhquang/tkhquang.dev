import "@/assets/styles/(default)/index.css";
import ClientSideTracking from "@/components/container/ClientSideTracking";
import BackToTopButton from "@/components/layout/BackToTop";
import AppProvider from "@/providers/AppProvider";
import { Portal } from "@ariakit/react";
import { Suspense } from "react";

export default async function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppProvider>
        {children}

        <Suspense>
          <Portal>
            <BackToTopButton className="mr-10 mb-20" />
          </Portal>
        </Suspense>
      </AppProvider>
      <Suspense>
        <ClientSideTracking />
      </Suspense>
    </>
  );
}
