import type { LedgerAnswer } from "@/lib/ledger-search/engine";

/**
 * Delimiters for matched text inside a snippet. Render their contents as text,
 * never as HTML.
 *
 * They live beside the message types rather than in the engine because the page
 * reads them and the engine module holds the whole WebAssembly bridge. A value
 * import of a mark from there puts `createEngine` in the bundle of every page
 * that carries a search field, where nothing can ever call it.
 */
export const MARK_OPEN = "\u0002";
export const MARK_CLOSE = "\u0003";

export type SearchWorkerRequest =
  | { type: "initialize"; module: ArrayBuffer; index: ArrayBuffer }
  | { type: "query"; id: number; query: string };

export type SearchWorkerResponse =
  | { type: "ready" }
  | { type: "answer"; id: number; answer: LedgerAnswer }
  | { type: "error" };
