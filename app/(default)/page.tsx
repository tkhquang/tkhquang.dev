import { Suspense } from "react";
import ReportView from "@/components/common/ReportView";
import Contact from "@/components/contact/Contact";
import Landing from "@/components/landing/Landing";
import Stacks from "@/components/landing/stacks/Stacks";
import Projects from "@/components/projects/Projects";

export const dynamic = "force-static";
export const revalidate = 86400;

export default async function HomePage() {
  return (
    <>
      <Suspense>
        <ReportView />
      </Suspense>
      <Landing />
      <Stacks />
      <Projects />
      <Contact />
    </>
  );
}
