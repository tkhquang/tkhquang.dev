import {
  createEngine,
  type LedgerEngine,
  type LedgerSection,
} from "@/lib/ledger-search/engine";
import {
  RESULT_LIMIT,
  type LedgerWindow,
  type SearchWorkerRequest,
  type SearchWorkerResponse,
} from "@/lib/ledger-search/protocol";

const scope = globalThis as unknown as Pick<
  Worker,
  "onmessage" | "postMessage"
>;
const send = (message: SearchWorkerResponse) => scope.postMessage(message);
let engine: LedgerEngine | null = null;

/**
 * Runs one pass of a query and either answers or asks for bytes.
 *
 * A pass that has been told the page has stopped fetching prints from what
 * arrived: a row that could not reach its reading text keeps its title and its
 * date and loses only the quote. The posting lists are not optional that way,
 * so a pass without them asks again and the page turns that into a failure the
 * reader can see rather than an empty result they would believe.
 */
function run(
  reader: LedgerEngine,
  id: number,
  query: string,
  supplied?: { section: LedgerSection; windows: LedgerWindow[]; more: boolean }
) {
  for (const window of supplied?.windows ?? []) {
    reader.supply(supplied!.section, window.start, new Uint8Array(window.bytes));
  }

  const lookup = reader.search(query, RESULT_LIMIT, supplied?.more ?? true);

  if (lookup.status === "request") {
    send({ type: "request", id, query, section: lookup.section, ranges: lookup.ranges });
    return;
  }

  send({ type: "answer", id, answer: lookup.answer });
}

scope.onmessage = async ({ data }: MessageEvent<SearchWorkerRequest>) => {
  try {
    if (data.type === "initialize") {
      const { instance } = await WebAssembly.instantiate(data.module, {});
      engine = createEngine(instance);
      if (!engine.load(new Uint8Array(data.index))) {
        throw new Error("The search index is incompatible.");
      }
      send({ type: "ready" });
      return;
    }

    if (!engine) throw new Error("The search engine is unavailable.");
    run(engine, data.id, data.query, data.type === "supply" ? data : undefined);
  } catch {
    send({ type: "error" });
  }
};
