/** Compatibility includes the binary layout, tokenizer, and position semantics. */
export const FORMAT_VERSION = 1;

export interface LedgerAnswer {
  /** Count before the result limit. */
  total: number;
  results: LedgerResult[];
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

interface Exports {
  memory: WebAssembly.Memory;
  alloc: (len: number) => number;
  dealloc: (pointer: number, len: number) => void;
  format_version: () => number;
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
  index_load: (pointer: number, len: number) => number;
  search_query: (pointer: number, len: number, limit: number) => number;
}

export interface LedgerEngine {
  /** Writes an index from entries given newest first. */
  build: (
    entries: {
      slug: string;
      title: string;
      date: string;
      dateLabel: string;
      body: string;
    }[]
  ) => Uint8Array;
  /** Copies the index into WASM. Returns false if the header is incompatible. */
  load: (index: Uint8Array) => boolean;
  search: (query: string, limit: number) => LedgerAnswer;
}

export function createEngine(instance: WebAssembly.Instance): LedgerEngine {
  const engine = instance.exports as unknown as Exports;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

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

  const build: LedgerEngine["build"] = (entries) => {
    engine.build_reset();

    for (const entry of entries) {
      const fields = [
        entry.slug,
        entry.title,
        entry.date,
        entry.dateLabel,
        entry.body,
      ].map(write);
      engine.build_add(...(fields.flat() as Parameters<Exports["build_add"]>));
      for (const [pointer, len] of fields) {
        engine.dealloc(pointer, len);
      }
    }

    const at = engine.build_finish();
    const length = numbers().getUint32(at, true);

    /* Copied out, because the next call into the module can move it. */
    return bytes().slice(at + 4, at + 4 + length);
  };

  const load: LedgerEngine["load"] = (index) => {
    const pointer = engine.alloc(index.length);
    bytes().set(index, pointer);
    const ok = engine.index_load(pointer, index.length) === 1;
    engine.dealloc(pointer, index.length);
    return ok;
  };

  const search: LedgerEngine["search"] = (query, limit) => {
    const [pointer, length] = write(query);
    const at = engine.search_query(pointer, length, limit);
    engine.dealloc(pointer, length);

    /* No WASM calls occur during result decoding, so these views stay valid. */
    const view = numbers();
    const memory = bytes();
    const total = view.getUint32(at, true);
    const count = view.getUint32(at + 4, true);

    const results: LedgerResult[] = [];
    let cursor = at + 8;

    const field = () => {
      const size = view.getUint32(cursor, true);
      cursor += 4;
      const text = decoder.decode(memory.subarray(cursor, cursor + size));
      cursor += size;
      return text;
    };

    /* Property order matches the packed result fields from search_query. */
    for (let index = 0; index < count; index += 1) {
      results.push({
        slug: field(),
        title: field(),
        date: field(),
        dateLabel: field(),
        snippet: field(),
      });
    }

    return { results, total };
  };

  return { build, load, search };
}
