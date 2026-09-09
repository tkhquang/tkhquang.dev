import { createEngine } from "@/lib/ledger-search/engine";
import { toLedgerEntries } from "@/lib/ledger-search/reading-text";
import type { MarkdownPost } from "@/models/markdown.types";
import fs from "node:fs";
import path from "node:path";
import "server-only";

/* Deploys use the committed module and require no Rust toolchain.
   Rebuild it with `pnpm build:search-engine` after engine changes. */
export const MODULE_PATH = "public/search/ljoss-search.wasm";

/** The same module writes and reads the index, with one format and tokenizer. */
export async function buildLedgerIndex(
  posts: MarkdownPost[]
): Promise<Uint8Array> {
  const source = await fs.promises.readFile(
    path.join(process.cwd(), MODULE_PATH)
  );

  const { instance } = await WebAssembly.instantiate(source, {});

  return createEngine(instance).build(toLedgerEntries(posts));
}
