import Provider from "./Provider";
import fs from "fs/promises";
import Mustache from "mustache";
import path from "path";

interface SpotifyOptions {
  width?: string;
  height?: string;
  [key: string]: any; // Additional options
}

// The player does not scale to its frame. It snaps to one of four fixed
// layouts chosen by max-height media queries inside the embed document
// (80 / 152 / 232 / 352), so any height between two of those steps renders
// the shorter layout and leaves the remainder as dead panel. Handing it an
// exact step is what keeps the frame flush with what it draws.
//
// Which step is right depends on the content: a track resolves to the
// compact single row, while anything fronting a collection needs the full
// card with its cover art. These are the per-type heights Spotify's own
// oEmbed returns.
const PLAYER_HEIGHTS: Record<string, string> = {
  album: "352",
  artist: "352",
  playlist: "352",
  track: "152",
};

// A playlist link carries its owner in the path (user/<name>/playlist), so
// the captured type arrives as a path rather than a bare noun and the lookup
// keys on the last segment. The compact row is the default for anything the
// map does not name, since it is the one layout that suits a citation.
function getPlayerHeight(type: string | false): string {
  const kind = (type || "").toLowerCase().split("/").pop() ?? "";
  return PLAYER_HEIGHTS[kind] ?? PLAYER_HEIGHTS.track;
}

class Spotify extends Provider {
  regexp: RegExp;
  idPosition: number;
  template: string;
  options: SpotifyOptions;

  constructor(options: SpotifyOptions) {
    super(options);

    // The id class stops at the query, so a "Copy link" URL's ?si= share
    // token stays out of the captured id. It would otherwise ride into both
    // the embed src and the frame's accessible name.
    this.regexp =
      /^https:\/\/open\.spotify\.com\/(user\/[A-Za-z0-9_-]*\/playlist|track|artist|album)\/([A-Za-z0-9_-]+)/i;
    // cwd-anchored like the content/ reads in MarkdownParser, because
    // import.meta.url points at Turbopack's relocated module path (under
    // .next on Windows dev)
    this.template = path.join(
      process.cwd(),
      "src/lib/remark-embed/templates/Spotify.mustache"
    );
    this.idPosition = 2;

    // Set default options. Height is deliberately absent: it depends on the
    // content type, which is only known per link, so it is resolved at render
    // time and an explicit option is what overrides it.
    this.options = {
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
      const type = this.getType(embedLink);

      // Render the template with Mustache
      return Mustache.render(templateContent, {
        height: this.options.height || getPlayerHeight(type),
        id: this.getEmbedId(embedLink),
        link: embedLink,
        options: this.options,
        type,
      });
    } catch (error: any) {
      throw new Error(`Failed to render Spotify embed: ${error?.message}`);
    }
  }
}

export default Spotify;
