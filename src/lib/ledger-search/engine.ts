/** Compatibility includes the binary layout, tokenizer, and position semantics. */
export const FORMAT_VERSION = 3;

export interface LedgerAnswer {
  /** Count before the result limit. */
  total: number;
  results: LedgerResult[];
  /** Words the dictionary did not hold, with what answered for them. */
  repairs: LedgerRepair[];
}

export interface LedgerRepair {
  typed: string;
  chosen: string;
}

export interface LedgerResult {
  slug: string;
  title: string;
  /** ISO instant, for the row's `time` element */
  date: string;
  dateLabel: string;
  /** The matched sentence, with each hit wrapped in the marks from `protocol` */
  snippet: string;
}

/** Which range-read artifact a request names. */
export type LedgerSection = "postings" | "body";

/** A byte range of one artifact, as the engine asks for it. */
export interface LedgerRange {
  start: number;
  length: number;
}

/**
 * One pass of a query.
 *
 * Two of the three artifacts are never fetched whole, so a pass that cannot
 * reach what it needs reports the ranges instead. The caller fetches them,
 * supplies them, and runs the same query again: ranking is deterministic, so
 * the second pass asks for what it now holds and moves on.
 *
 * The order is fixed by what depends on what. The posting lists come first,
 * because nothing can be ranked without them. The windows of reading text come
 * second, because which windows to quote is not known until the ranking is.
 */
export type LedgerLookup =
  | { status: "answer"; answer: LedgerAnswer }
  | { status: "request"; section: LedgerSection; ranges: LedgerRange[] };

interface Exports {
  memory: WebAssembly.Memory;
  alloc: (len: number) => number;
  dealloc: (pointer: number, len: number) => void;
  format_version: () => number;
  index_load: (pointer: number, len: number) => number;
  section_supply: (
    section: number,
    start: number,
    pointer: number,
    len: number
  ) => void;
  section_held: (section: number) => number;
  search_query: (
    pointer: number,
    len: number,
    limit: number,
    mayQuoteBlind: number
  ) => number;
}

/** The three the `builder` feature adds. A module built without it has none. */
interface BuilderExports extends Exports {
  build_reset: () => void;
  build_add: (
    slug: number,
    slugLen: number,
    title: number,
    titleLen: number,
    date: number,
    dateLen: number,
    label: number,
    labelLen: number,
    body: number,
    bodyLen: number
  ) => void;
  build_finish: () => number;
}

export interface LedgerEngine {
  /** Copies the index into WASM. Returns false if the header is incompatible. */
  load: (index: Uint8Array) => boolean;
  /** Hands over one fetched range of an artifact, at its offset there. */
  supply: (section: LedgerSection, start: number, bytes: Uint8Array) => void;
  /** Bytes of one artifact the engine is holding. */
  held: (section: LedgerSection) => number;
  /**
   * Runs one query. `mayQuoteBlind` false stops the reading text being asked
   * for again, leaving a row without its quoted line rather than without a row.
   * It does not apply to the posting lists, which are asked for until they
   * arrive because an answer without them would be wrong rather than thinner.
   */
  search: (
    query: string,
    limit: number,
    mayQuoteBlind?: boolean
  ) => LedgerLookup;
}

export interface LedgerBuilder {
  /** Writes all three artifacts from entries given newest first. */
  build: (
    entries: {
      slug: string;
      title: string;
      date: string;
      dateLabel: string;
      body: string;
    }[]
  ) => { index: Uint8Array; postings: Uint8Array; body: Uint8Array };
}

/* The order the ABI codes them in. */
const SECTIONS: LedgerSection[] = ["postings", "body"];

/**
 * Refuses a module that speaks another format, then hands back what every call
 * across the ABI needs: the exports, refreshed views of WASM memory, and one
 * borrowed UTF-8 allocation.
 */
function bridge<Module extends Exports = Exports>(
  instance: WebAssembly.Instance
) {
  const engine = instance.exports as unknown as Module;
  const encoder = new TextEncoder();

  if (engine.format_version() !== FORMAT_VERSION) {
    throw new Error(
      `Search module speaks format ${engine.format_version()}, this build expects ${FORMAT_VERSION}`
    );
  }

  /* WASM memory growth detaches prior views. Refresh after each allocation. */
  const bytes = () => new Uint8Array(engine.memory.buffer);
  const numbers = () => new DataView(engine.memory.buffer);

  /* The module borrows each UTF-8 allocation for one call. */
  const write = (text: string): [number, number] => {
    const encoded = encoder.encode(text);
    const pointer = engine.alloc(encoded.length);
    bytes().set(encoded, pointer);
    return [pointer, encoded.length];
  };

  return { bytes, engine, numbers, write };
}

export function createEngine(instance: WebAssembly.Instance): LedgerEngine {
  const { bytes, engine, numbers, write } = bridge(instance);
  const decoder = new TextDecoder();

  const load: LedgerEngine["load"] = (index) => {
    const pointer = engine.alloc(index.length);
    bytes().set(index, pointer);
    const ok = engine.index_load(pointer, index.length) === 1;
    engine.dealloc(pointer, index.length);
    return ok;
  };

  const supply: LedgerEngine["supply"] = (section, start, supplied) => {
    if (supplied.length === 0) return;

    const pointer = engine.alloc(supplied.length);
    bytes().set(supplied, pointer);
    engine.section_supply(
      SECTIONS.indexOf(section),
      start,
      pointer,
      supplied.length
    );
    engine.dealloc(pointer, supplied.length);
  };

  const search: LedgerEngine["search"] = (
    query,
    limit,
    mayQuoteBlind = true
  ) => {
    const [pointer, length] = write(query);
    const at = engine.search_query(
      pointer,
      length,
      limit,
      mayQuoteBlind ? 1 : 0
    );
    engine.dealloc(pointer, length);

    /* No WASM calls occur during decoding, so these views stay valid. */
    const view = numbers();
    const memory = bytes();
    let cursor = at + 4;

    if (view.getUint32(at, true) === 1) {
      const section = SECTIONS[view.getUint32(cursor, true)];
      const count = view.getUint32(cursor + 4, true);
      const ranges: LedgerRange[] = [];
      cursor += 8;

      for (let index = 0; index < count; index += 1) {
        ranges.push({
          start: view.getUint32(cursor, true),
          length: view.getUint32(cursor + 4, true),
        });
        cursor += 8;
      }

      return { ranges, section, status: "request" };
    }

    /* The answer opens with the total before the limit, then the shown count. */
    const total = view.getUint32(cursor, true);
    const shown = view.getUint32(cursor + 4, true);
    cursor += 8;

    const field = () => {
      const size = view.getUint32(cursor, true);
      cursor += 4;
      const text = decoder.decode(memory.subarray(cursor, cursor + size));
      cursor += size;
      return text;
    };

    const results: LedgerResult[] = [];

    /* Property order matches the packed result fields from search_query. */
    for (let index = 0; index < shown; index += 1) {
      results.push({
        slug: field(),
        title: field(),
        date: field(),
        dateLabel: field(),
        snippet: field(),
      });
    }

    const repairs: LedgerRepair[] = [];
    const repaired = view.getUint32(cursor, true);
    cursor += 4;

    for (let index = 0; index < repaired; index += 1) {
      repairs.push({ typed: field(), chosen: field() });
    }

    return { answer: { repairs, results, total }, status: "answer" };
  };

  return {
    held: (section) => engine.section_held(SECTIONS.indexOf(section)),
    load,
    search,
    supply,
  };
}

/**
 * Writes an index, which happens once per build and never in a browser.
 *
 * Separate from `createEngine` so a page that imports only that one does not
 * carry this.
 */
export function createBuilder(instance: WebAssembly.Instance): LedgerBuilder {
  const { bytes, engine, numbers, write } = bridge<BuilderExports>(instance);

  const build: LedgerBuilder["build"] = (entries) => {
    engine.build_reset();

    for (const entry of entries) {
      const fields = [
        entry.slug,
        entry.title,
        entry.date,
        entry.dateLabel,
        entry.body,
      ].map(write);
      engine.build_add(
        ...(fields.flat() as Parameters<BuilderExports["build_add"]>)
      );
      for (const [pointer, len] of fields) {
        engine.dealloc(pointer, len);
      }
    }

    /* Each artifact is written length first. Copied out, because the next call
       into the module can move all of them. */
    const at = engine.build_finish();
    const view = numbers();
    const memory = bytes();
    const written: Uint8Array[] = [];
    let cursor = at;

    for (let artifact = 0; artifact < 3; artifact += 1) {
      const length = view.getUint32(cursor, true);
      written.push(memory.slice(cursor + 4, cursor + 4 + length));
      cursor += 4 + length;
    }

    const [index, postings, body] = written;
    return { body, index, postings };
  };

  return { build };
}
