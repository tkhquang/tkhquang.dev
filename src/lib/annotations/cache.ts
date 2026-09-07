import type { AnnotationRecord } from "./types";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import sanitize from "sanitize-filename";

/* In the build's own cache rather than in the repository. What is kept
   here is a copy of somebody else's page, which does not belong in the
   history of this one, and it is a cache in the plain sense: losing it
   costs a slower build, never a wrong one. The build tool preserves
   this directory between builds and the host restores it between
   deploys, so in practice it is filled once and read thereafter. One
   file per link, so build workers filling it side by side never write
   over each other. */
export const annotationsDirectory =
  process.env.ANNOTATIONS_CACHE_DIR ??
  path.join(process.cwd(), ".next", "cache", "annotations");

/* A destination that gave nothing is asked again after a week: long
   enough that a dead link does not slow every build by its timeout,
   short enough that a page that was down comes back on its own */
const RETRY_FAILURE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/* Readable enough to find in the directory, unique by the hash: the
   host and path are the name, cut before the file system objects */
export function getAnnotationFileName(url: string): string {
  const { hostname, pathname } = new URL(url);
  const stem = sanitize(`${hostname}${pathname}`.replace(/\//g, "-"))
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const hash = crypto.createHash("sha1").update(url).digest("hex").slice(0, 8);
  return `${stem}-${hash}.json`;
}

export async function readAnnotationRecord(
  url: string
): Promise<AnnotationRecord | null> {
  const file = path.join(annotationsDirectory, getAnnotationFileName(url));
  try {
    const record = JSON.parse(
      await fs.promises.readFile(file, { encoding: "utf8" })
    ) as AnnotationRecord;
    return record.url === url ? record : null;
  } catch {
    return null;
  }
}

export async function writeAnnotationRecord(
  record: AnnotationRecord
): Promise<void> {
  await fs.promises.mkdir(annotationsDirectory, { recursive: true });
  const file = path.join(
    annotationsDirectory,
    getAnnotationFileName(record.url)
  );
  await fs.promises.writeFile(file, `${JSON.stringify(record, null, 2)}\n`);
}

export function isFailureFresh(record: AnnotationRecord): boolean {
  if (!record.failure) return false;
  const age = Date.now() - new Date(record.fetchedAt).getTime();
  return Number.isFinite(age) && age < RETRY_FAILURE_AFTER_MS;
}
