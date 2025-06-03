import { getYearsOfExperience } from "@/utils/date";

export namespace Site {
  export const METADATA = {
    coverImageUrl: "/uploads/images/default.jpg",
  };
}

export namespace Portfolio {
  export const METADATA = {
    about: `
<p>Hi, I'm Quang Trinh Khac (or just Aleks). I'm an engineer with a genuine curiosity for technology, open source, and the little things that make software work. By day, I build user interfaces with React and modern web tools. By night, I like to explore how things work under the hood, modding games, tinkering with code, and sharing what I learn with others.</p>

<p>
I studied in the Advanced Education Program (AEP) in Information Systems at Ho Chi Minh City University of Information Technology (UIT), where I found a real passion for learning, both inside and outside the classroom. While my path hasn't been the most traditional, hands-on experience and continuous improvement have shaped my journey.
</p>

<p>
I'm grateful for the open source community, where I've learned a lot and enjoy giving back when I can. I sometimes share modding tools for games, contribute to public projects, and experiment with both web and systems-level code. If you appreciate reliable engineering and a bit of creative problem-solving, I'd be happy to connect.
</p>

<p>
Along the way, I've picked up a solid toolkit and a few specialties:
</p>

<ul>
  <li>Semantic, accessible HTML & responsive CSS (SCSS, TailwindCSS, CSS-in-JS)</li>
  <li>JavaScript and TypeScript: React, Vue, Next.js, and more</li>
  <li>Backend with Elixir/Phoenix, Node.js, API design, and server-side rendering</li>
  <li>Focus on user experience, performance, and maintainable code</li>
  <li>Comfortable with Git, collaboration, and Agile environments</li>
  <li>Some experience in game modding, reverse engineering, and lower-level tech</li>
</ul>

<p>
I enjoy working with teams who care about quality and learning. If you'd like to collaborate or just talk shop, feel free to reach out!
</p>
`,
    description: `Engineer with ${getYearsOfExperience("2019-01-01")}+ years of experience: front-end by day (React, Vue, Next.js), open source and modding enthusiast by night (C++, Rust, game projects). I like building reliable web apps and tools, and I'm always open to learning new things or taking on creative challenges. Let's connect if you share similar interests!`,
    title: "Aleks's Portfolio",
  };
}

export namespace Blog {
  export const METADATA = {
    author: "Aleks",
    description:
      "Hi, I'm Aleks, a Software Engineer with a passion for open-source projects and micro startups. This blog is my little corner of the internet where I share thoughts on topics I love, interesting stories, and the occasional deep dive into technical challenges.",
    title: {
      default: "Ljóss - The Portal To A Nobody's Inner World",
      template: "%s | Ljóss - The Portal To A Nobody's Inner World",
    },
  };
}
