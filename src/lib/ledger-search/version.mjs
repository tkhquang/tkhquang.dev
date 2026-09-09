import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const SOURCE_FILES = [
  "app/(blog)/blog/search-index/[version]/route.ts",
  "next.config.mjs",
  "package.json",
  "pnpm-lock.yaml",
  "public/search/ljoss-search.wasm",
  "src/lib/MarkdownParser.ts",
  "src/lib/ledger-search/build-index.ts",
  "src/lib/ledger-search/engine.ts",
  "src/lib/ledger-search/reading-text.ts",
  "src/lib/ledger-search/version.mjs",
  "src/utils/posts.ts",
  "tsconfig.json",
];

/* Hash raw inputs before compilation. The published roster and binary index
   still come exclusively from the static route. */
export function getLedgerSearchVersion(root = process.cwd()) {
  const inputs = [...SOURCE_FILES];

  for (const directory of ["content/categories", "content/posts"]) {
    inputs.push(
      ...readdirSync(path.join(root, directory))
        .filter((name) => name.endsWith(".md"))
        .map((name) => `${directory}/${name}`)
    );
  }

  const hash = createHash("sha256");

  /* Date labels use the build timezone. Node and its platform can affect
     compression, so their identities also belong to the immutable URL. */
  hash.update(
    JSON.stringify({
      node: process.version,
      platform: process.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
  );

  for (const input of inputs.sort()) {
    const bytes = readFileSync(path.join(root, input));

    hash.update(`${input}\0${bytes.length}\0`);
    hash.update(bytes);
  }

  return hash.digest("hex");
}
