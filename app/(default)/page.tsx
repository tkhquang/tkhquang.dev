import ReportView from "@/components/common/ReportView";
import Contact from "@/components/contact/Contact";
import Landing from "@/components/landing/Landing";
import Stacks from "@/components/landing/stacks/Stacks";
import Projects from "@/components/projects/Projects";
import { Footer, Header, Main } from "@/components/layout";
import { Suspense } from "react";

export const dynamic = "force-static";
export const revalidate = 86400;

export default async function HomePage() {
  return (
    <>
      <Header />
      <Main className="flex-1">
        <Suspense>
          <ReportView />
        </Suspense>
        <Landing />
        <Stacks />
        <Projects />
        <Contact />
      </Main>
      <Footer />
    </>
  );
}
