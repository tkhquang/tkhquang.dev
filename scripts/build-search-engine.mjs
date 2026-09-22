/* Compiles the search crate twice and commits both modules.
   Run with `pnpm build:search-engine`. */

import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");

const MANIFEST_PATH = "search-engine/Cargo.toml";
const TARGET = "wasm32-unknown-unknown";

/* Where cargo leaves the module, whichever set of features produced it. */
const COMPILED_PATH = `search-engine/target/${TARGET}/release/ljoss_search.wasm`;

/* One crate, two modules. The writer runs once per build under Node and never
   in a browser, so it sits behind the `builder` feature: the module a page
   downloads is compiled without it, and `pnpm build:search-index` loads the one
   that keeps it. The reader cannot live beside it under `public`, because
   nothing there escapes being served. */
const MODULES = [
  {
    destination: "public/search/ljoss-search.wasm",
    flags: ["--no-default-features"],
    name: "reader",
  },
  {
    destination: "search-engine/ljoss-search-builder.wasm",
    flags: [],
    name: "builder",
  },
];

/* Both builds compile to the same path, so each module's bytes are taken before
   the next build overwrites them, and neither destination is written until both
   have succeeded. A run that stopped between the two would leave a reader and a
   writer built from different sources, and an index written by one is only
   readable by the other while the two agree. */
const compiled = [];

for (const { destination, flags, name } of MODULES) {
  const cargo = spawnSync(
    "cargo",
    [
      "build",
      "--release",
      "--manifest-path",
      path.join(root, MANIFEST_PATH),
      "--target",
      TARGET,
      ...flags,
    ],
    { stdio: "inherit" }
  );

  if (cargo.error) throw cargo.error;

  if (cargo.status !== 0) {
    throw new Error(
      `cargo left the ${name} module unbuilt, exiting ${cargo.status}`
    );
  }

  compiled.push({
    bytes: await fs.readFile(path.join(root, COMPILED_PATH)),
    destination,
    name,
  });
}

for (const { bytes, destination, name } of compiled) {
  await fs.writeFile(path.join(root, destination), bytes);
  console.info(`Search ${name}: ${bytes.byteLength} bytes at ${destination}`);
}
