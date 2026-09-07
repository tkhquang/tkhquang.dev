import type { WaybackArchive } from "./types";

const SAVE_TIMEOUT_MS = 20_000;
const LOOKUP_TIMEOUT_MS = 10_000;

/* Long enough that a link cited once and rebuilt weekly is captured a
   handful of times a year, short enough that the copy beside the card's
   words is never wildly older than they are. The archive decides: it
   hands back the copy it already holds when one is younger than this,
   so asking on every build costs nothing and is not a discourtesy. */
const IF_NOT_ARCHIVED_WITHIN = "30d";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36";

interface Availability {
  archived_snapshots?: {
    closest?: { available: boolean; url: string; timestamp: string };
  };
}

interface SaveAnswer {
  job_id?: string;
  timestamp?: string;
  url?: string;
  status?: string;
  status_ext?: string;
  message?: string;
}

/* The archive's own keys, from archive.org/account/s3.php. Without them
   a caller is held to a few captures a minute counted against its whole
   network rather than itself, which on a home connection or a build
   runner means the save is refused far more often than it is taken. */
const credentials = () => {
  const key = process.env.ARCHIVE_S3_ACCESS_KEY;
  const secret = process.env.ARCHIVE_S3_SECRET_KEY;
  return key && secret ? `LOW ${key}:${secret}` : null;
};

/* The Wayback Machine's own answer for the copy nearest to now. A page
   whose host asks the crawler to keep away has no copy and never will,
   and answers exactly as a page nobody has archived yet does. */
async function findArchive(url: string): Promise<WaybackArchive | null> {
  const response = await fetch(
    `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
    {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    }
  );
  if (!response.ok) return null;
  const { archived_snapshots } = (await response.json()) as Availability;
  const closest = archived_snapshots?.closest;
  if (!closest?.available) return null;
  return {
    url: closest.url.replace(/^http:/, "https:"),
    timestamp: closest.timestamp,
  };
}

/**
 * Asks archive.org to keep a copy of the page, then reads back the copy
 * it holds.
 *
 * The save is the documented form: a POST that asks for JSON, carrying
 * the keys when the build has them. The older plain GET is the web page
 * a person clicks, and it is refused by rate limit far more often than
 * it is taken, silently, which is how a site can believe it has been
 * archiving for months without a single copy being made.
 *
 * The capture itself happens in the archive's own time, so nothing here
 * waits for it. When the archive already holds a copy young enough it
 * says so at once and that copy is used; otherwise the lookup answers
 * with whatever copy exists today and the next build asks again.
 */
export async function archivePage(url: string): Promise<WaybackArchive | null> {
  const authorization = credentials();
  try {
    const body = new URLSearchParams({
      url,
      if_not_archived_within: IF_NOT_ARCHIVED_WITHIN,
    });
    const saved = await fetch("https://web.archive.org/save", {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body,
      signal: AbortSignal.timeout(SAVE_TIMEOUT_MS),
    });

    if (!saved.ok) {
      /* Said out loud on purpose. A refused save that is swallowed
         leaves the site believing it has a copy it has never had, and
         the only way to tell is to notice the absence months later. */
      console.warn(
        `Archive save refused for ${url}: ${saved.status}${
          authorization ? "" : " (no archive.org keys configured)"
        }`
      );
    } else {
      const answer = (await saved.json()) as SaveAnswer;
      if (answer.status_ext || answer.status === "error") {
        console.warn(
          `Archive save failed for ${url}: ${answer.status_ext ?? answer.message ?? "unknown"}`
        );
      }
      /* The copy it already held, handed back rather than taken again */
      if (answer.timestamp) {
        return {
          url:
            answer.url && answer.url.startsWith("http")
              ? answer.url
              : `https://web.archive.org/web/${answer.timestamp}/${url}`,
          timestamp: answer.timestamp,
        };
      }
    }
  } catch (error) {
    console.warn(
      `Archive save failed for ${url}: ${error instanceof Error ? error.message : error}`
    );
  }
  return findArchive(url);
}
