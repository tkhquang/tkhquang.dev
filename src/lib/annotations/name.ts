import crypto from "crypto";
import sanitize from "sanitize-filename";

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
