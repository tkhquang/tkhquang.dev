import "./AboutMe.scss";
import Image from "@/components/common/NextImage";
import { Portfolio } from "@/constants/meta";
import { getProcessedImage } from "@/utils/image";

const RESUME = {
  fileName: "Quang Trinh Khac - Resume.pdf",
  path: "https://github.com/tkhquang/tkhquang-resume/raw/main/output/Quang_Trinh_Khac-Resume.pdf",
};

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

        <div className="download-container flex-center my-2 flex-col">
          <a
            className="download__link shadow-md"
            target="_blank"
            rel=" noopener noreferrer"
            title="View Resume"
            href={RESUME.path}
          >
            <span>Download</span>
            <span>PDF</span>
          </a>
          <a
            target="_blank"
            href={RESUME.path}
            rel="noopener noreferrer"
            title="View Resume"
          >
            {RESUME.fileName}
          </a>
        </div>
      </div>
    </section>
  );
};

export default AboutMe;
