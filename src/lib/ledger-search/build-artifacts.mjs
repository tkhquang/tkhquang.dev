import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

import { createEngine } from "./engine.ts";
import { toLedgerEntries } from "./reading-text.ts";
import { readPostRecords, selectPublishedPosts } from "../../utils/posts.ts";

/* Deploys use the committed module and require no Rust toolchain.
   Rebuild it with `pnpm build:search-engine` after engine changes. */
const MODULE_PATH = "public/search/ljoss-search.wasm";

/** Served straight from the CDN, so the artifacts are files rather than routes. */
const ARTIFACT_DIRECTORY = "public/search";
const ARTIFACT_ROUTE = "/search";

/* The engine reads the index as bytes and browsers decode gzip before it ever
   sees them, so the wire form is chosen once at build time rather than
   negotiated. A static file cannot vary on Accept-Encoding, and every client
   that reaches this asset advertises gzip. */
const INDEX_SUFFIX = ".bin";

/* The postings and the reading text are served exactly as written, because a
   byte range into a compressed stream names nothing. Neither is fetched whole,
   so what they cost on the wire is what a query actually reads of them: the
   lists of its own terms, and one window per result it prints. */
const POSTINGS_SUFFIX = ".pst";
const BODY_SUFFIX = ".pool";

const SUFFIXES = [INDEX_SUFFIX, POSTINGS_SUFFIX, BODY_SUFFIX];

/* Imported by the client, so the addresses reach the bundle through the module
   graph rather than through the build config. They carry the digest, which is
   what makes a page that outlives its build find a 404 on its next window of
   reading text rather than text whose offsets belong to another index. */
const ADDRESS_PATH = "src/generated/ledger-search.mjs";

/**
 * Writes the search artifacts and the manifest that addresses them.
 *
 * The address carries a digest of the index bytes themselves. Nothing can
 * change the index without moving its URL, and nothing that leaves the index
 * alone can move it, which is what a hand-maintained list of build inputs
 * could not promise in either direction: a new input was silently missed, and
 * an unrelated one silently reprinted the archive.
 */
export async function buildLedgerArtifacts({ log = () => {} } = {}) {
  const root = process.cwd();
  const compiled = await fs.readFile(path.join(root, MODULE_PATH));
  const { instance } = await WebAssembly.instantiate(compiled, {});

  const posts = selectPublishedPosts(await readPostRecords());
  const { body, index, postings } = createEngine(instance).build(
    toLedgerEntries(posts)
  );

  /* One digest addresses all three. The other two are written by the same pass
     that writes the index and are only meaningful against its offsets, so they
     can never be allowed to move apart. */
  const digest = createHash("sha256").update(index).digest("hex");
  const encoded = gzipSync(index, { level: 9 });

  const directory = path.join(root, ARTIFACT_DIRECTORY);
  await fs.mkdir(directory, { recursive: true });

  /* One build's artifacts at a time. A reader holding the previous address
     receives a 404 and is told to reload, which is the only correct answer:
     the address it holds was compiled into the page it is already running. */
  for (const stale of await fs.readdir(directory)) {
    const generated = SUFFIXES.some((suffix) => stale.endsWith(suffix));

    if (generated && !stale.startsWith(digest)) {
      await fs.rm(path.join(directory, stale));
    }
  }

  await fs.writeFile(path.join(directory, `${digest}${INDEX_SUFFIX}`), encoded);
  await fs.writeFile(path.join(directory, `${digest}${POSTINGS_SUFFIX}`), postings);
  await fs.writeFile(path.join(directory, `${digest}${BODY_SUFFIX}`), body);

  const manifest = {
    entries: posts.length,
    index: `${ARTIFACT_ROUTE}/${digest}${INDEX_SUFFIX}`,
    /* The index as the engine reads it, and as the wire carries it. */
    bytes: index.byteLength,
    encoded: encoded.byteLength,
    postings: `${ARTIFACT_ROUTE}/${digest}${POSTINGS_SUFFIX}`,
    postingsBytes: postings.byteLength,
    body: `${ARTIFACT_ROUTE}/${digest}${BODY_SUFFIX}`,
    bodyBytes: body.byteLength,
  };

  await fs.mkdir(path.join(root, path.dirname(ADDRESS_PATH)), {
    recursive: true,
  });
  await fs.writeFile(
    path.join(root, ADDRESS_PATH),
    [
      "/* Written by `pnpm build:search-index`. Do not edit. */",
      `export const INDEX_URL = "${manifest.index}";`,
      `export const POSTINGS_URL = "${manifest.postings}";`,
      `export const BODY_URL = "${manifest.body}";`,
      "",
    ].join("\n")
  );

  log(
    `Search index: ${manifest.entries} entries, ${manifest.bytes} bytes, ${manifest.encoded} encoded, ${manifest.postingsBytes} of postings, ${manifest.bodyBytes} of reading text, at ${manifest.index}`
  );

  return manifest;
}

/* Run as a script, not when a test imports the builder. */
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await buildLedgerArtifacts({ log: console.info });
}
