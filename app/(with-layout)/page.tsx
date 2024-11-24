import Contact from "@/components/contact/Contact";
import Landing from "@/components/landing/Landing";
import Stacks from "@/components/landing/stacks/Stacks";
import Projects from "@/components/projects/Projects";

export const dynamic = "force-static";

export default function Home() {
  return (
    <>
      <Landing />
      <Stacks />
      <Projects />
      <Contact />
    </>
  );
}
