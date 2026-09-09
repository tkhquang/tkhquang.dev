import { createEngine, type LedgerEngine } from "@/lib/ledger-search/engine";
import type {
  SearchWorkerRequest,
  SearchWorkerResponse,
} from "@/lib/ledger-search/protocol";

const scope = globalThis as unknown as Pick<
  Worker,
  "onmessage" | "postMessage"
>;
const send = (message: SearchWorkerResponse) => scope.postMessage(message);
let engine: LedgerEngine | null = null;

scope.onmessage = async ({ data }: MessageEvent<SearchWorkerRequest>) => {
  try {
    if (data.type === "initialize") {
      const { instance } = await WebAssembly.instantiate(data.module, {});
      engine = createEngine(instance);
      if (!engine.load(new Uint8Array(data.index))) {
        throw new Error("The search index is incompatible.");
      }
      send({ type: "ready" });
    } else {
      if (!engine) throw new Error("The search engine is unavailable.");
      send({
        type: "answer",
        id: data.id,
        answer: engine.search(data.query, 12),
      });
    }
  } catch {
    send({ type: "error" });
  }
};
