import { getYearsOfExperience } from "@/utils/date";

export namespace Site {
  export const METADATA = {
    coverImageUrl: "/uploads/images/default.jpg",
  };
}

export namespace Portfolio {
  export const METADATA = {
    about: `<p>Hi there! My full name is Quang Trinh Khac, but feel free to call me Aleks. I am a former student of the Advanced Education Program (AEP) in Information Systems at Ho Chi Minh City University of Information Technology. While I haven't yet completed my degree due to unforeseen circumstances, my passion for technology and continuous learning remains unwavering.</p>

<p>
I am a highly motivated and self-driven developer with a strong understanding of HTML, CSS, JavaScript, and modern frameworks such as React and Vue. My goal is to launch a successful career building high-quality web applications and services. I take pride in delivering work that is fully responsive, thoroughly tested across a wide range of devices, and built with clean, maintainable, and well-organized code.
</p>

<p>
If you're looking for an engineer who can provide exceptional solutions, I'd be thrilled to collaborate. Here’s what I bring to the table:
</p>

<ul>
  <li>Semantic HTML and responsive CSS</li>
  <li>Proficiency in JavaScript (Vanilla, ReactJS, VueJS, etc.)</li>
  <li>Focus on delivering high-level user experiences</li>
  <li>Adherence to best practices in web development</li>
  <li>Experience with Git for version control</li>
  <li>Knowledge of Agile/Scrum methodologies</li>
</ul>

<p>
Feel free to get in touch—I’d love to help bring your ideas to life!
</p>`,
    description: `Versatile Front-End Engineer with ${getYearsOfExperience(
      "2019-01-01"
    )}+ years of experience in designing, developing, and maintaining complex web applications. Specializing in modern JavaScript libraries and frameworks like React and Vue, I am committed to delivering forward-thinking solutions and fostering a collaborative work environment. I aim to leverage my expertise to drive innovative strategies that enhance engagement and increase conversions.`,
    title: "Aleks's Portfolio",
  };
}

export namespace Blog {
  export const METADATA = {
    author: "Aleks",
    description:
      "Hi, I'm Aleks—a Software Engineer with a passion for open-source projects and micro startups. This blog is my little corner of the internet where I share thoughts on topics I love, interesting stories, and the occasional deep dive into technical challenges.",
    title: {
      default: "Ljóss - The Portal To A Nobody's Inner World",
      template: "%s | Ljóss - The Portal To A Nobody's Inner World",
    },
  };
}
