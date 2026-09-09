/* The builder reads the roster from the working directory, so the fixture has
   to be in place before the module that resolves those paths is imported. */

import assert from "node:assert/strict";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { gunzipSync } from "node:zlib";

/* The fixture states the layout it builds rather than importing it, so a move
   fails here instead of following the builder wherever it went. */
const MODULE_PATH = "public/search/ljoss-search.wasm";
const ARTIFACT_DIRECTORY = "public/search";
const ADDRESS_PATH = "src/generated/ledger-search.mjs";

const repository = path.join(import.meta.dirname, "..", "..", "..");
const root = mkdtempSync(path.join(tmpdir(), "ljoss-search-artifacts-"));

for (const directory of [
  "content/categories",
  "content/posts",
  "public/search",
  "src/generated",
]) {
  mkdirSync(path.join(root, directory), { recursive: true });
}

copyFileSync(path.join(repository, MODULE_PATH), path.join(root, MODULE_PATH));

writeFileSync(
  path.join(root, "content/categories/technical.md"),
  "---\ntitle: Technical\nslug: technical\n---\n"
);

function writePost(name, { published = true, body = "" } = {}) {
  writeFileSync(
    path.join(root, `content/posts/${name}.md`),
    `---\ntitle: ${name}\ndescription: An entry about ${name}\ncreated_at: 2026-03-0${name.length % 9}\npublished: ${published}\ncategory_slug: technical\ntags:\n  - reverse engineering\n---\n\n${body}\n`
  );
}

writePost("first", { body: "The camera matrix waits in the vtable." });
writePost("second", { body: "Following the font files led to Skia." });
writePost("draft", { published: false, body: "An unfinished camera note." });

const previous = process.cwd();
process.chdir(root);
process.on("exit", () => {
  process.chdir(previous);
  rmSync(root, { force: true, recursive: true });
});

const { buildLedgerArtifacts } = await import("./build-artifacts.mjs");
const { createEngine } = await import("./engine.ts");

const artifacts = () =>
  readdirSync(path.join(root, ARTIFACT_DIRECTORY))
    .filter((name) => /\.(bin|pst|pool)$/.test(name))
    .sort();

const written = (built) =>
  [built.index, built.postings, built.body]
    .map((url) => path.basename(url))
    .sort();

/* The module the client imports, read as text: it is generated, so a test that
   imported it would be reading whichever build ran last. */
const addresses = () => readFileSync(path.join(root, ADDRESS_PATH), "utf8");

/* Loaded the way the page loads it, except that the reading text is handed
   over whole rather than fetched a window at a time. */
async function loadIndex(built) {
  const source = readFileSync(path.join(root, "public", built.index));
  const { instance } = await WebAssembly.instantiate(
    readFileSync(path.join(root, MODULE_PATH)),
    {}
  );
  const engine = createEngine(instance);

  assert.equal(engine.load(gunzipSync(source)), true);
  for (const section of ["postings", "body"]) {
    const artifact = readFileSync(path.join(root, "public", built[section]));
    engine.supply(section, 0, artifact);
  }

  return (query) => {
    const lookup = engine.search(query, 12);
    assert.equal(lookup.status, "answer", query);
    return lookup.answer;
  };
}

test("the manifest addresses the bytes it reports", async () => {
  const built = await buildLedgerArtifacts();

  const generated = addresses();
  for (const line of [
    `export const INDEX_URL = "${built.index}";`,
    `export const POSTINGS_URL = "${built.postings}";`,
    `export const BODY_URL = "${built.body}";`,
  ]) {
    assert.ok(generated.includes(line), line);
  }

  assert.match(built.index, /^\/search\/[a-f0-9]{64}\.bin$/);
  assert.match(built.postings, /^\/search\/[a-f0-9]{64}\.pst$/);
  assert.match(built.body, /^\/search\/[a-f0-9]{64}\.pool$/);
  assert.deepEqual(artifacts(), written(built));

  const source = readFileSync(path.join(root, "public", built.index));
  assert.equal(source.byteLength, built.encoded);
  assert.equal(gunzipSync(source).byteLength, built.bytes);

  /* The postings and the reading text are served as written, because a byte
     range into a compressed stream names nothing. */
  const lists = readFileSync(path.join(root, "public", built.postings));
  assert.equal(lists.byteLength, built.postingsBytes);

  const text = readFileSync(path.join(root, "public", built.body));
  assert.equal(text.byteLength, built.bodyBytes);
  assert.ok(text.toString("utf8").includes("The camera matrix waits"));
});

test("only the published roster reaches the index, newest first", async () => {
  const built = await buildLedgerArtifacts();
  const search = await loadIndex(built);

  assert.equal(built.entries, 2);
  assert.deepEqual(
    search("camera ").results.map((result) => result.slug),
    ["first"]
  );
  assert.deepEqual(
    search("entry ").results.map((result) => result.slug),
    ["second", "first"]
  );
});

test("an edit that changes the index moves the URL and clears the old file", async () => {
  const before = await buildLedgerArtifacts();

  writePost("second", {
    date: "2026-03-01",
    body: "Following the font files led to Chromium.",
  });
  const after = await buildLedgerArtifacts();

  assert.notEqual(after.index, before.index);
  assert.deepEqual(artifacts(), written(after));
});

test("a change that cannot reach the index leaves the URL where it is", async () => {
  const before = await buildLedgerArtifacts();

  writeFileSync(path.join(root, "content/posts/notes.txt"), "scratch");
  writePost("draft", {
    date: "2026-06-01",
    published: false,
    body: "Rewritten, still unpublished.",
  });

  assert.equal((await buildLedgerArtifacts()).index, before.index);
});

test("a build repeated over untouched content writes the same address", async () => {
  const first = await buildLedgerArtifacts();
  const second = await buildLedgerArtifacts();

  assert.deepEqual(second, first);
  assert.deepEqual(artifacts(), written(first));
});
