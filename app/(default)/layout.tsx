import "@/assets/styles/(default)/index.css";
import ClientSideTracking from "@/components/container/ClientSideTracking";
import BackToTopButton from "@/components/layout/BackToTop";
import { DEFAULT_LOCALE, getMessages } from "@/lib/i18n";
import AppProvider from "@/providers/AppProvider";
import { Portal } from "@ariakit/react/portal";
import { Suspense } from "react";

export default async function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppProvider
        locale={DEFAULT_LOCALE}
        messages={getMessages(DEFAULT_LOCALE)}
      >
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
