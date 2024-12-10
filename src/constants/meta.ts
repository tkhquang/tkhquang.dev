import { getYearsOfExperience } from "@/utils/date";

export namespace Portfolio {
  export const METADATA = {
    description: `Versatile Front-End Engineer with ${getYearsOfExperience(
      "2019-01-01"
    )}+ years of experience in designing, developing, and maintaining complex web applications. Specializing in modern JavaScript libraries and frameworks like React and Vue, I am committed to delivering forward-thinking solutions and fostering a collaborative work environment. I aim to leverage my expertise to drive innovative strategies that enhance engagement and increase conversions.`,
    title: "Aleks's Portfolio",
  };
}

export namespace Blog {
  export const METADATA = {
    description:
      "Hello there, I'm Aleks, a Software Engineer who loves open-source products and micro startups. This blog is just a place for me to post random stuff about things I like, interesting stories, and sometimes technical problems.",
    title: {
      default: "Ljóss - The Portal To A Nobody's Inner World",
      template: "%s | Ljóss - The Portal To A Nobody's Inner World",
    },
  };
}
