import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { getLedgerSearchVersion } from "./version.mjs";

const INPUTS = [
  "app/(blog)/blog/search-index/[version]/route.ts",
  "content/categories/technical.md",
  "content/posts/first.md",
  "content/posts/second.md",
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

function fixture(t, files = INPUTS) {
  const root = mkdtempSync(path.join(tmpdir(), "ljoss-search-version-"));

  t.after(() => rmSync(root, { force: true, recursive: true }));

  for (const input of files) {
    const file = path.join(root, input);

    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, input);
  }

  return root;
}

test("index URLs do not depend on checkout path or file creation order", (t) => {
  const first = fixture(t);
  const second = fixture(t, [...INPUTS].reverse());
  const version = getLedgerSearchVersion(first);

  assert.match(version, /^[a-f0-9]{64}$/);
  assert.equal(getLedgerSearchVersion(second), version);
});

test("content and build input changes invalidate an immutable index URL", (t) => {
  const root = fixture(t);
  const version = getLedgerSearchVersion(root);

  for (const input of INPUTS) {
    const file = path.join(root, input);
    const original = readFileSync(file);

    writeFileSync(file, Buffer.concat([original, Buffer.from(" changed")]));
    assert.notEqual(getLedgerSearchVersion(root), version, input);
    writeFileSync(file, original);
  }

  assert.equal(getLedgerSearchVersion(root), version);
});

test("a post rename invalidates the URL because the result slug changes", (t) => {
  const root = fixture(t);
  const version = getLedgerSearchVersion(root);

  renameSync(
    path.join(root, "content/posts/first.md"),
    path.join(root, "content/posts/renamed.md")
  );

  assert.notEqual(getLedgerSearchVersion(root), version);
});

test("non-Markdown files do not enter the roster fingerprint", (t) => {
  const root = fixture(t);
  const version = getLedgerSearchVersion(root);

  writeFileSync(path.join(root, "content/posts/scratch.txt"), "scratch");

  assert.equal(getLedgerSearchVersion(root), version);
});

test("a missing engine artifact stops version generation", (t) => {
  const root = fixture(t);

  rmSync(path.join(root, "public/search/ljoss-search.wasm"));

  assert.throws(() => getLedgerSearchVersion(root), { code: "ENOENT" });
});
