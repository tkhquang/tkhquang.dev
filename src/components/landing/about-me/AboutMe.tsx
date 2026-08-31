import "./AboutMe.css";
import Reveal from "@/components/common/Reveal";
import SectionHeading from "@/components/common/SectionHeading";
import ResumeDownload from "@/components/landing/about-me/ResumeDowload";
import RightNow from "@/components/landing/about-me/RightNow";
import { Portfolio } from "@/constants/meta";

const AboutMe = () => {
  return (
    <section
      className="about scroll-mt-header-height container pt-16 pb-8"
      id="about"
    >
      <SectionHeading kicker="Who I am" title="About Me" emoji="🙋🏻‍♂️" />
      <div className="grid gap-12 lg:grid-cols-[minmax(0,40rem)_20rem] lg:justify-between">
        <Reveal>
          <div
            className="typography about__prose"
            dangerouslySetInnerHTML={{
              __html: Portfolio.METADATA.about,
            }}
          ></div>
        </Reveal>
        <Reveal
          delay={100}
          className="flex flex-col gap-5 lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:self-start"
        >
          <RightNow />
          <ResumeDownload />
        </Reveal>
      </div>
    </section>
  );
};

export default AboutMe;
