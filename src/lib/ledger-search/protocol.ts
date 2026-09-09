import type {
  LedgerAnswer,
  LedgerRange,
  LedgerSection,
} from "@/lib/ledger-search/engine";

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

/** Results one query prints, which is also how many body ranges it can want. */
export const RESULT_LIMIT = 12;

/** One fetched range of an artifact, at its offset in that file. */
export interface LedgerWindow {
  start: number;
  bytes: ArrayBuffer;
}

/**
 * A query crosses this boundary once for each artifact it has to reach.
 *
 * The engine reads the index, names the byte ranges it needs, and the page
 * fetches them and sends them back. The posting lists come first, because
 * nothing can be ranked without them; the windows of reading text come second,
 * because which windows to quote is not known until the ranking is. The query
 * travels with every message, so the worker keeps no state between passes and
 * two fields racing can never be answered with each other's bytes.
 *
 * The page rather than the worker does the fetching, because the page already
 * owns every other request this feature makes: it is where a 404 becomes
 * "the ledger has been reprinted, reload", and where a superseded keystroke
 * aborts what it started.
 */
export type SearchWorkerRequest =
  | { type: "initialize"; module: ArrayBuffer; index: ArrayBuffer }
  | { type: "query"; id: number; query: string }
  | {
      type: "supply";
      id: number;
      query: string;
      section: LedgerSection;
      windows: LedgerWindow[];
      /** False once the page has stopped fetching for this query. */
      more: boolean;
    };

export type SearchWorkerResponse =
  | { type: "ready" }
  /** The ranges of one artifact this query still needs. */
  | {
      type: "request";
      id: number;
      query: string;
      section: LedgerSection;
      ranges: LedgerRange[];
    }
  | { type: "answer"; id: number; answer: LedgerAnswer }
  | { type: "error" };
