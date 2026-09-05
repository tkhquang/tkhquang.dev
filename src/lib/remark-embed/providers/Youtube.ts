import Provider from "./Provider";
import Mustache from "mustache";
import path from "path";

interface YoutubeOptions {
  nocookie?: boolean;
  width?: string;
  margin?: string;
  align?: string;
  [key: string]: any;
}

class Youtube extends Provider {
  constructor(options: YoutubeOptions) {
    super(options);

    this.regexp =
      /(?:https?:)?(?:\/\/)(?:www\.)?(?:(?:youtube(?:-nocookie)?\.com\/(?:(?:(?:watch|embed)(?:\?v=|\/)((?!videoseries)[\w-]{11}))|(?:playlist|embed\/videoseries)\?list=([\w-]{34}))|youtu.be\/([\w-]{11})))[?=&+%\w.-]*/i;
    // cwd-anchored like the content/ reads in MarkdownParser, because
    // import.meta.url points at Turbopack's relocated module path (under
    // .next on Windows dev)
    this.template = path.join(
      process.cwd(),
      "src/lib/remark-embed/templates/Youtube.mustache"
    );
    this.idPosition = 1;

    const alignment = options.align || "auto";
    this.options = {
      margin: `0 ${alignment}`,
      nocookie: true,
      width: "100%",
      ...options,
    };
  }

  getEmbedId(url: string): string | false {
    const res = url.match(this.regexp)?.filter((x) => x !== undefined);
    return res ? res[this.idPosition] : false;
  }

  isPlayList(embedLink: string): boolean {
    return embedLink.includes("playlist") || embedLink.includes("videoseries");
  }

  async getEmbedData(embedLink: string): Promise<string> {
    const template = this.getTemplate();

    return Mustache.render(template, {
      id: this.getEmbedId(embedLink),
      link: embedLink,
      options: this.options,
      playlist: this.isPlayList(embedLink),
    });
  }
}

export default Youtube;
