import Image from "next/image";

import Me from "@/assets/resources/images/Aleks.png";
import "./AboutMe.scss";

const ABOUT_ME = `<p>
My full name is Quang Trinh Khac, but you can call me Aleks. I am a
former student of the Advanced Education Program (AEP) in
Information System at Ho Chi Minh City University of Information
Technology. However, for some inexplicable reason, I have not
finished my degree yet.
</p>

<p>
I am a highly motivated, self-starting developer with a good
understanding of HTML, CSS, JavaScript and its modern libraries and frameworks such
as React, Vue,... seeking to launch a career building
web applications and services. The work I provide is of highest
quality, fully responsive, and well-tested in a wide variety of
devices. The code I write is easy to maintain because it is clean,
concise and ordered.
</p>

<p>
Do not hesitate to get in touch with me if you are looking for an
Engineer who can provide:
</p>

<ul>
<li>Semantic HTML/Responsive CSS</li>
<li>JavaScript (Vanilla, ReactJS, VueJS,...)</li>
<li>High-level user experience</li>
<li>Best practices</li>
<li>Git</li>
<li>Agile/Scrums (Software development)</li>
</ul>`;

const RESUME = {
  path: "https://github.com/tkhquang/tkhquang-resume/raw/main/output/Quang_Trinh_Khac-Resume.pdf",
  fileName: "Quang Trinh Khac - Resume.pdf",
};

const AboutMe = () => {
  return (
    <section className="about">
      <div className="container max-w-[1280px]">
        <h2 className="heading--section my-10 text-4xl">About Me 🙋‍♂️</h2>
        <div className="flex-center flex-col-reverse lg:flex-row flex-gap-8">
          <div
            className="w-full lg:w-2/3 typography"
            dangerouslySetInnerHTML={{
              __html: ABOUT_ME,
            }}
          ></div>
          <div className="author w-10/12 md:w-8/12 lg:w-1/3 p-6 mx-6 my-auto flex-center">
            <Image
              className="author__image object-cover"
              src={Me}
              width={500}
              height={500}
              alt="Aleks"
            />
          </div>
        </div>

        <div className="download-container flex-center flex-col my-2">
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
