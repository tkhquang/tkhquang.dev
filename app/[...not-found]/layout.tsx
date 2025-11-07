import "@/assets/styles/index.css";
import ClientSideTracking from "@/components/container/ClientSideTracking";
import { Footer, Header, Main } from "@/components/layout";
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
      <Suspense>
        <ClientSideTracking />
      </Suspense>
      <AppProvider>
        <Header useScroll={false} />
        <Main className="flex-1">{children}</Main>
        <Footer />
      </AppProvider>
    </>
  );
}
