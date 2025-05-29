import "./AboutMe.scss";
import Image from "next/image";
import { Portfolio } from "@/constants/meta";
import { getPlaceholderImage } from "@/utils/next-mage";

const RESUME = {
  fileName: "Quang Trinh Khac - Resume.pdf",
  path: "https://github.com/tkhquang/tkhquang-resume/raw/main/output/Quang_Trinh_Khac-Resume.pdf",
};

const AboutMe = async () => {
  const aboutImage = await getPlaceholderImage(
    "/assets/resources/images/Aleks-3.jpg"
  );

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
          <div className="author flex-center mx-6 my-10 w-10/12 p-6 md:w-8/12 lg:w-1/3">
            <div className="relative w-full pb-[100%]">
              <Image
                fill
                sizes="auto"
                className="author__image object-cover object-[20%_50%]"
                src={aboutImage.src}
                alt="Aleks"
                placeholder="blur"
                blurDataURL={aboutImage.placeholder}
              />
            </div>
          </div>
        </div>

        <div className="download-container flex-center my-2 flex-col">
          <a
            className="download__link shadow-md"
            target="_blank"
            rel="noopener noreferrer"
            title="View Resume"
            href={RESUME.path}
          >
            <span>Download</span>
            <span>PDF</span>
          </a>
          <a target="_blank" rel="noopener noreferrer" title="View Resume">
            {RESUME.fileName}
          </a>
        </div>
      </div>
    </section>
  );
};

export default AboutMe;
