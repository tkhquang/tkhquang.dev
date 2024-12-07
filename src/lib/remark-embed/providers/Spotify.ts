import path from "path";
import Mustache from "mustache";
import Provider from "./Provider";
import { fileURLToPath } from "url";
import fs from "fs/promises";

interface SpotifyOptions {
  width?: string;
  height?: string;
  [key: string]: any; // Additional options
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class Spotify extends Provider {
  regexp: RegExp;
  idPosition: number;
  template: string;
  options: SpotifyOptions;

  constructor(options: SpotifyOptions) {
    super(options);

    this.regexp =
      /^https:\/\/open\.spotify\.com\/(user\/[A-Za-z0-9-_]*\/playlist|track|artist|album)\/([A-Za-z0-9-_?=]+)/i;
    this.template = path.resolve(__dirname, "../templates/Spotify.mustache");
    this.idPosition = 2;

    // Set default options
    this.options = {
      width: "100%",
      height: "400",
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
        id: this.getEmbedId(embedLink),
        type: this.getType(embedLink),
        link: embedLink,
        embedData: "",
        options: this.options,
      });
    } catch (error: any) {
      throw new Error(`Failed to render Spotify embed: ${error?.message}`);
    }
  }
}

export default Spotify;
