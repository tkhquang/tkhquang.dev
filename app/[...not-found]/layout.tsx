import "@/assets/styles/index.css";
import ClientSideTracking from "@/components/container/ClientSideTracking";
import { Footer, Header, Main } from "@/components/layout";
import { DEFAULT_LOCALE, getMessages } from "@/lib/i18n";
import AppProvider from "@/providers/AppProvider";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "404 | Not Found",
};

export default async function NotFoundLayout({
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
        <Header useScroll={false} />
        <Main className="flex-1">{children}</Main>
        <Footer />
      </AppProvider>
      <Suspense>
        <ClientSideTracking />
      </Suspense>
    </>
  );
}
