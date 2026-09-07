import { archivePage } from "./archive";
import {
  isFailureFresh,
  readAnnotationRecord,
  writeAnnotationRecord,
} from "./cache";
import { fetchAnnotation } from "./fetch";
import { classifyLink, type LinkTarget } from "./parse";
import { takeSnapshot } from "./snapshot";
import type { Annotation, AnnotationRecord } from "./types";
import { getSlipKey } from "@/lib/slips/key";
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

/* Only a destination that is nothing but a page is photographed: the
   other kinds carry their own text in the card */
const wantsSnapshot = (record: AnnotationRecord) =>
  record.annotation?.kind === "page";

const copiesDue = (record: AnnotationRecord) => {
  if (!record.annotation) return false;
  if (record.archive && (record.snapshot || !wantsSnapshot(record))) {
    return false;
  }
  if (!record.copiesTriedAt) return true;
  const age = Date.now() - new Date(record.copiesTriedAt).getTime();
  return !Number.isFinite(age) || age >= RETRY_COPIES_AFTER_MS;
};

/* The frozen copies of a destination: the site's own screenshot for a
   page, and the archive.org copy for anything, each kept once it exists
   and each retried on its own until it does */
async function takeCopies(record: AnnotationRecord): Promise<void> {
  const key = getSlipKey(record.url);
  const [snapshot, archive] = await Promise.all([
    record.snapshot ??
      (wantsSnapshot(record)
        ? takeSnapshot(record.url, key).catch((error) => {
            console.warn(
              `No snapshot for ${record.url}: ${error instanceof Error ? error.message : error}`
            );
            return undefined;
          })
        : undefined),
    record.archive ?? archivePage(record.url).catch(() => null),
  ]);
  record.snapshot = snapshot;
  record.archive = archive ?? undefined;
  record.copiesTriedAt = new Date().toISOString();
}

async function resolve(target: LinkTarget): Promise<AnnotationRecord | null> {
  let record = await readAnnotationRecord(target.url);
  let changed = false;

  if (!record?.annotation) {
    if (record && isFailureFresh(record)) return null;
    const fetchedAt = new Date().toISOString();
    try {
      const annotation = await fetchAnnotation(target);
      record = { url: target.url, fetchedAt, annotation };
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
 * copies, from the cache beside the posts or, the first time a link is
 * met, from the destination. Null for a link the slip leaves alone and
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
