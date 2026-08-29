import "server-only";

import fs from "fs";
import path from "path";

export const postsDirectory = path.join(process.cwd(), "content", "posts");

export function getPostFiles() {
  return fs
    .readdirSync(postsDirectory, { encoding: "utf8" })
    .filter((files) => files.endsWith(".md"));
}
