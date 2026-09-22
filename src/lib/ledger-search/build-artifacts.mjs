import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

import { createBuilder } from "./engine.ts";
import { toLedgerEntries } from "./reading-text.ts";
import { readPostRecords, selectPublishedPosts } from "../../utils/posts.ts";

/* Deploys use the committed module and require no Rust toolchain.
   Rebuild it with `pnpm build:search-engine` after engine changes.

   Not the module under `public`: that one is compiled without the writer, and
   nothing under `public` escapes being served. */
const MODULE_PATH = "search-engine/ljoss-search-builder.wasm";

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
   graph rather than through the build config. The shared digest keeps an old
   page's cached ranges within its own generation. A range missing after a
   deploy returns 404 rather than bytes whose offsets belong to another index. */
const ADDRESS_PATH = "src/generated/ledger-search.mjs";

/**
 * Addresses the complete logical generation, before transport compression.
 * The tag versions the hash framing. Fixed-width byte lengths keep artifact
 * boundaries unambiguous; the order is index, postings, then reading text.
 */
export function generationDigest({ index, postings, body }) {
  const hash = createHash("sha256").update("ljoss-search-generation-v1\0");
  const length = Buffer.alloc(8);

  for (const artifact of [index, postings, body]) {
    length.writeBigUInt64LE(BigInt(artifact.byteLength));
    hash.update(length).update(artifact);
  }

  return hash.digest("hex");
}

/**
 * Writes the search artifacts and the manifest that addresses them.
 *
 * Every address carries a digest of all three artifacts. A change to any one
 * moves every URL, even if the dictionary and offsets in the index stay the
 * same. An unchanged generation keeps its addresses regardless of build inputs.
 */
export async function buildLedgerArtifacts({ log = () => {} } = {}) {
  const root = process.cwd();
  const compiled = await fs.readFile(path.join(root, MODULE_PATH));
  const { instance } = await WebAssembly.instantiate(compiled, {});

  const posts = selectPublishedPosts(await readPostRecords());
  const { body, index, postings } = createBuilder(instance).build(
    toLedgerEntries(posts)
  );

  /* The index does not determine the other two: a case-only edit can change
     the reading text alone, and reordered words can change posting ordinals
     without changing the dictionary or offsets. Hash every artifact so cached
     ranges always belong to the generation their addresses name. */
  const digest = generationDigest({ index, postings, body });
  const encoded = gzipSync(index, { level: 9 });

  const directory = path.join(root, ARTIFACT_DIRECTORY);
  await fs.mkdir(directory, { recursive: true });

  /* One build's artifacts at a time. A reader holding a previous address can
     keep using cached bytes. If a range is no longer available, a 404 tells it
     to reload: its artifact addresses were compiled into the existing page. */
  for (const stale of await fs.readdir(directory)) {
    const generated = SUFFIXES.some((suffix) => stale.endsWith(suffix));

    if (generated && !stale.startsWith(digest)) {
      await fs.rm(path.join(directory, stale));
    }
  }

  await fs.writeFile(path.join(directory, `${digest}${INDEX_SUFFIX}`), encoded);
  await fs.writeFile(
    path.join(directory, `${digest}${POSTINGS_SUFFIX}`),
    postings
  );
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
