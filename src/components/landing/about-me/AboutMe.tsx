import "./AboutMe.scss";
import Image from "@/components/common/NextImage";
import ResumeDownload from "@/components/landing/about-me/ResumeDowload";
import { Portfolio } from "@/constants/meta";
import { getProcessedImage } from "@/utils/image";

const ABOUT_ME_IMAGE = "/assets/resources/images/Aleks-3.png";

const AboutMe = async () => {
  const aboutImage = await getProcessedImage({
    source: ABOUT_ME_IMAGE,
    shouldStore: false,
    cache: true,
  });

  return (
    <section className="about">
      <div className="container">
        <h2 className="heading--section my-10 text-4xl">About Me 🙋🏻‍♂️</h2>
        <div className="flex-center flex-gap-8 flex-col-reverse lg:flex-row">
          <div
            className="typography w-full lg:w-2/3"
            dangerouslySetInnerHTML={{
              __html: Portfolio.METADATA.about,
            }}
          ></div>
          <div className="author flex-center mx-6 my-10 w-4/5 p-6 xs:w-1/2 md:w-1/3">
            <div className="relative w-full pb-[100%]">
              <Image
                fill
                sizes="auto"
                className="author__image object-cover object-[15%_50%]"
                src={aboutImage.source}
                alt="Aleks"
                placeholder="blur"
                blurDataURL={aboutImage.placeholder}
                loading="eager"
                containerClassName="author__image--border"
              />
            </div>
          </div>
        </div>

        <ResumeDownload />
      </div>
    </section>
  );
};

export default AboutMe;
