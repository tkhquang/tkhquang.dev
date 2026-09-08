import { getAnnotationFileName } from "./name";
import { readShared, writeShared } from "./store";
import type { AnnotationRecord } from "./types";
import fs from "fs";
import path from "path";

/* This build's own copy, in its cache rather than in the repository:
   a copy of somebody else's page does not belong in the history of
   this one. Losing it costs a slower build, never a wrong one, because
   the shared store in store.ts holds the copy that has to last and
   this is only the reading the current build works from. One file per
   link, so build workers filling it side by side never write over each
   other. */
export const annotationsDirectory =
  process.env.ANNOTATIONS_CACHE_DIR ??
  path.join(process.cwd(), ".next", "cache", "annotations");

/* A destination that gave nothing is asked again after a week: long
   enough that a dead link does not slow every build by its timeout,
   short enough that a page that was down comes back on its own */
const RETRY_FAILURE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

const readLocal = async (url: string): Promise<AnnotationRecord | null> => {
  const file = path.join(annotationsDirectory, getAnnotationFileName(url));
  try {
    const record = JSON.parse(
      await fs.promises.readFile(file, { encoding: "utf8" })
    ) as AnnotationRecord;
    return record.url === url ? record : null;
  } catch {
    return null;
  }
};

const writeLocal = async (record: AnnotationRecord): Promise<void> => {
  await fs.promises.mkdir(annotationsDirectory, { recursive: true });
  const file = path.join(
    annotationsDirectory,
    getAnnotationFileName(record.url)
  );
  await fs.promises.writeFile(file, `${JSON.stringify(record, null, 2)}\n`);
};

/**
 * The record for a link: from this build's own cache when it has one,
 * and from the shared store when it does not. A record taken from the
 * store is written locally as well, so the rest of the build reads it
 * from disk rather than asking again.
 */
export async function readAnnotationRecord(
  url: string
): Promise<AnnotationRecord | null> {
  const local = await readLocal(url);
  if (local) return local;
  const shared = await readShared(url);
  if (shared) await writeLocal(shared);
  return shared;
}

/* Kept in both: this build reads its own copy for the rest of the run,
   and the shared store keeps it for every run after, on any machine */
export async function writeAnnotationRecord(
  record: AnnotationRecord
): Promise<void> {
  await Promise.all([writeLocal(record), writeShared(record)]);
}

export function isFailureFresh(record: AnnotationRecord): boolean {
  if (!record.failure) return false;
  const age = Date.now() - new Date(record.fetchedAt).getTime();
  return Number.isFinite(age) && age < RETRY_FAILURE_AFTER_MS;
}
