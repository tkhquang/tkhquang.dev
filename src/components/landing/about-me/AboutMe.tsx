import "./AboutMe.css";
import Reveal from "@/components/common/Reveal";
import SectionHeading from "@/components/common/SectionHeading";
import ResumeDownload from "@/components/landing/about-me/ResumeDownload";
import RightNow from "@/components/landing/about-me/RightNow";
import { Portfolio } from "@/constants/meta";

const AboutMe = () => {
  return (
    <section
      className="about scroll-mt-header-height container pt-16 pb-8"
      id="about"
    >
      <SectionHeading kicker="Who I am" title="About Me" emoji="🙋🏻‍♂️" />
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_18rem] md:gap-8 lg:grid-cols-[minmax(0,40rem)_20rem] lg:justify-between lg:gap-12">
        <Reveal>
          <div
            className="typography about__prose max-w-2xl"
            dangerouslySetInnerHTML={{
              __html: Portfolio.METADATA.about,
            }}
          ></div>
        </Reveal>
        <Reveal
          delay={100}
          className="mx-auto grid w-full max-w-md grid-cols-1 content-start gap-5 md:sticky md:top-[calc(var(--header-height)+2rem)] md:mx-0 md:max-w-none md:self-start"
        >
          <RightNow />
          <ResumeDownload />
        </Reveal>
      </div>
    </section>
  );
};

export default AboutMe;
