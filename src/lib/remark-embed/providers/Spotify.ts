import Provider from "./Provider";
import fs from "fs/promises";
import Mustache from "mustache";
import path from "path";

interface SpotifyOptions {
  width?: string;
  height?: string;
  [key: string]: any; // Additional options
}

class Spotify extends Provider {
  regexp: RegExp;
  idPosition: number;
  template: string;
  options: SpotifyOptions;

  constructor(options: SpotifyOptions) {
    super(options);

    this.regexp =
      /^https:\/\/open\.spotify\.com\/(user\/[A-Za-z0-9-_]*\/playlist|track|artist|album)\/([A-Za-z0-9-_?=]+)/i;
    // cwd-anchored like the content/ reads in MarkdownParser, because
    // import.meta.url points at Turbopack's relocated module path (under
    // .next on Windows dev)
    this.template = path.join(
      process.cwd(),
      "src/lib/remark-embed/templates/Spotify.mustache"
    );
    this.idPosition = 2;

    // Set default options
    this.options = {
      height: "400",
      width: "100%",
      ...options, // Override with provided options
    };
  }

  getType(embedLink: string): string | false {
    const res = embedLink.match(this.regexp);
    return res ? res[1] : false;
  }

  async getEmbedData(embedLink: string): Promise<string> {
    try {
      // Read the template file asynchronously
      const templateContent = await fs.readFile(this.template, "utf8");

      // Render the template with Mustache
      return Mustache.render(templateContent, {
        embedData: "",
        id: this.getEmbedId(embedLink),
        link: embedLink,
        options: this.options,
        type: this.getType(embedLink),
      });
    } catch (error: any) {
      throw new Error(`Failed to render Spotify embed: ${error?.message}`);
    }
  }
}

export default Spotify;
