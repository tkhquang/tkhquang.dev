import { Footer, Header, Main } from "@/components/layout";

export default async function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header useScroll={false} />
      <Main className="flex-1">{children}</Main>
      <Footer />
    </>
  );
}
