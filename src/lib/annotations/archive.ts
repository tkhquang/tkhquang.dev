import type { WaybackArchive } from "./types";

const SAVE_TIMEOUT_MS = 20_000;
const LOOKUP_TIMEOUT_MS = 10_000;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36";

interface Availability {
  archived_snapshots?: {
    closest?: { available: boolean; url: string; timestamp: string };
  };
}

/* The Wayback Machine's own answer for the copy nearest to now */
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
 * it holds. Save Page Now answers a plain GET without an account, slowly
 * and with a rate limit, so the save is a request rather than a promise:
 * when it is refused the lookup still returns whatever copy already
 * exists, and null means the destination is not archived yet, to be
 * asked about again on a later build.
 */
export async function archivePage(url: string): Promise<WaybackArchive | null> {
  try {
    const saved = await fetch(`https://web.archive.org/save/${url}`, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: AbortSignal.timeout(SAVE_TIMEOUT_MS),
    });
    /* A save answers with the copy's own address, in either header
       depending on the day; a match is the copy, and anything else
       falls through to the lookup */
    const location =
      saved.headers.get("content-location") ?? saved.headers.get("location");
    const match = location && /\/web\/(\d{14})\//.exec(location);
    if (saved.ok && match) {
      return {
        url: location.startsWith("http")
          ? location
          : `https://web.archive.org${location}`,
        timestamp: match[1],
      };
    }
  } catch {
    /* Refused or slow: the lookup below still answers for an older copy */
  }
  return findArchive(url);
}
