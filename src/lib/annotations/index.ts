import { archivePage } from "./archive";
import {
  isFailureFresh,
  readAnnotationRecord,
  writeAnnotationRecord,
} from "./cache";
import { fetchAnnotation } from "./fetch";
import { classifyLink, type LinkTarget } from "./parse";
import type { Annotation, AnnotationRecord } from "./types";
import "server-only";

export { classifyLink } from "./parse";
export type { Annotation, AnnotationRecord } from "./types";

/* A page whose copies could not be taken is asked again after a week,
   the same patience the failed fetch gets */
const RETRY_COPIES_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/* A link cited twice on a page, or on two pages in one worker, is asked
   about once */
const inflight = new Map<string, Promise<AnnotationRecord | null>>();

/* A refusal the destination itself gave (a missing page, a head with
   nothing in it) as against the network failing to deliver one: a
   timeout, a dropped connection, a rate limit, a server error */
function isDefinitiveFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  if (error.name === "TimeoutError" || error.name === "AbortError") {
    return false;
  }
  /* fetch reports a connection that never answered as a TypeError */
  if (error instanceof TypeError) return false;
  const status = /^(\d{3})\b/.exec(error.message)?.[1];
  if (!status) return true;
  return status !== "429" && status !== "408" && !status.startsWith("5");
}

/* Raise this whenever a destination is read differently: a new field,
   a better extract, a fixed parser. Every cached record is then read
   again on the next build. */
const READING_VERSION = 1;

/* A copy of a page ages: the one archive.org held when the link was
   first cited may be years older than the words the card prints beside
   it, so a copy this old is asked about again even though one exists */
const ARCHIVE_STALE_AFTER_MS = 180 * 24 * 60 * 60 * 1000;

const archiveStale = (record: AnnotationRecord) => {
  if (!record.archive) return true;
  const taken = record.archive.timestamp.slice(0, 8);
  const when = Date.parse(
    `${taken.slice(0, 4)}-${taken.slice(4, 6)}-${taken.slice(6, 8)}`
  );
  if (!Number.isFinite(when)) return false;
  return Date.now() - when >= ARCHIVE_STALE_AFTER_MS;
};

const copiesDue = (record: AnnotationRecord) => {
  if (!record.annotation) return false;
  if (!archiveStale(record)) return false;
  if (!record.copiesTriedAt) return true;
  const age = Date.now() - new Date(record.copiesTriedAt).getTime();
  return !Number.isFinite(age) || age >= RETRY_COPIES_AFTER_MS;
};

/* The copy archive.org holds of a destination, asked for once and then
   asked about again when the one on record has aged. The site keeps no
   copy of its own picture any more: the page's own words travel in the
   annotation, which is the copy that survives and the copy a reader can
   actually read. */
async function takeCopies(record: AnnotationRecord): Promise<void> {
  const archive = await archivePage(record.url).catch(() => null);
  /* A fresh answer replaces the old one, and no answer leaves whatever
     was already known rather than forgetting it */
  record.archive = archive ?? record.archive;
  record.copiesTriedAt = new Date().toISOString();
}

async function resolve(target: LinkTarget): Promise<AnnotationRecord | null> {
  let record: AnnotationRecord | null | undefined = await readAnnotationRecord(
    target.url
  );
  let changed = false;

  /* A record written by an older reading of the destinations is read
     again, so improving how a page is read reaches the pages already
     cached instead of only the ones cited next. Only the reading is
     dropped: the archive copy found for this link was not read from the
     destination and does not go stale because the reader did. */
  const kept = record?.readingVersion === READING_VERSION ? undefined : record;
  if (kept) record = undefined;

  if (!record?.annotation) {
    if (record && isFailureFresh(record)) return null;
    const fetchedAt = new Date().toISOString();
    try {
      const annotation = await fetchAnnotation(target);
      record = {
        url: target.url,
        fetchedAt,
        readingVersion: READING_VERSION,
        annotation,
        archive: kept?.archive,
        copiesTriedAt: kept?.copiesTriedAt,
      };
      changed = true;
    } catch (error) {
      const failure = error instanceof Error ? error.message : String(error);
      console.warn(`No annotation for ${target.url}: ${failure}`);
      /* Only an answer that means the destination has nothing to print
         is worth remembering for a week; a timeout, a dropped
         connection, a rate limit or a server error is the network's
         mood, and the next build asks again */
      if (isDefinitiveFailure(error)) {
        await writeAnnotationRecord({ url: target.url, fetchedAt, failure });
      }
      return null;
    }
  }

  if (copiesDue(record)) {
    await takeCopies(record);
    changed = true;
  }
  if (changed) await writeAnnotationRecord(record);
  return record;
}

/**
 * The annotation record for a link that leaves the site, with its
 * copies, from the build's own cache or, the first time a link is met
 * or the first build after the reading changed, from the destination. Null for a link the slip leaves alone and
 * for a destination that gave nothing, so the link stays an ordinary
 * link either way.
 */
export async function getAnnotationRecord(
  href: string
): Promise<AnnotationRecord | null> {
  const target = classifyLink(href);
  if (!target) return null;

  const pending = inflight.get(target.url);
  if (pending) return pending;

  const task = resolve(target).catch((error) => {
    console.warn(`Annotation lookup failed for ${target.url}`, error);
    return null;
  });
  inflight.set(target.url, task);
  return task;
}

export async function getAnnotation(href: string): Promise<Annotation | null> {
  return (await getAnnotationRecord(href))?.annotation ?? null;
}
