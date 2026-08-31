import { getYearsOfExperience } from "@/utils/date";

export namespace Site {
  export const METADATA = {
    coverImageUrl: "/uploads/images/default.jpg",
  };
}

export namespace Portfolio {
  export const METADATA = {
    about: `
<p>Hi, I'm Quang Trinh Khac (or just Aleks). I'm an engineer with a genuine curiosity for technology, open source, and the little things that make software work. By day, I build user interfaces with React and modern web tools. By night, I explore how things work under the hood: modding games, reverse engineering, and sharing what I learn along the way.</p>

<p>
I studied in the Advanced Education Program (AEP) in Information Systems at Ho Chi Minh City University of Information Technology (UIT), where I found a real passion for learning, both inside and outside the classroom. While my path hasn't been the most traditional, hands-on experience and continuous improvement have shaped my journey.
</p>

<p>
I'm grateful for the open source community, where I've learned a lot and enjoy giving back when I can. I share modding tools for games, contribute to public projects, and experiment with both web and systems-level code. If you appreciate reliable engineering and a bit of creative problem-solving, I'd be happy to connect.
</p>

<p>
I enjoy working with teams who care about quality and learning. If you'd like to collaborate or just talk shop, feel free to reach out!
</p>
`,
    description: `Engineer with ${getYearsOfExperience("2019-01-01")}+ years of experience: front-end by day, open source and modding enthusiast by night.`,
    title: "Aleks's Portfolio",
  };

  /** Content of the "Right now" plate on the homepage; edit here */
  export const RIGHT_NOW = {
    basedIn: {
      city: "Ho Chi Minh City",
      gmtLabel: "GMT+7",
      timeZone: "Asia/Ho_Chi_Minh",
    },
    modding: "Crimson Desert",
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
  export const POSTS_PER_PAGE = 15;
}
