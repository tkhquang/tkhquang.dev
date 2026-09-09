import type { LedgerAnswer } from "@/lib/ledger-search/engine";
import type {
  SearchWorkerRequest,
  SearchWorkerResponse,
} from "@/lib/ledger-search/protocol";

/** Each query word expands its own postings. Bound work in the shared worker. */
export const MAX_QUERY_LENGTH = 512;

/**
 * Rejects a query whose artifacts are gone from the server.
 *
 * The artifact URL carries the fingerprint of the build that rendered the page,
 * and the index route publishes exactly one version, so a 404 means a newer
 * build has replaced this one. Editing the query cannot reach the new address,
 * because the old one is compiled into the script the page is already running.
 * Only a fresh document does.
 */
export class SearchIndexReplaced extends Error {}

interface PendingQuery {
  id: number;
  query: string;
  finish: (answer: LedgerAnswer | null, error?: Error) => void;
}

interface SearchRuntime {
  search: (query: string, signal?: AbortSignal) => Promise<LedgerAnswer | null>;
}

/* One runtime survives client navigation and serves every field in the tab. */
let shared: SearchRuntime | null = null;

function createRuntime(): SearchRuntime {
  const worker = new Worker(new URL("./worker.ts", import.meta.url), {
    name: "ledger-search",
    type: "module",
  });
  const download = new AbortController();
  const queue: PendingQuery[] = [];
  let active: PendingQuery | null = null;
  let nextId = 0;
  let ready = false;
  let closed = false;

  const send = (message: SearchWorkerRequest, transfer: Transferable[] = []) =>
    worker.postMessage(message, transfer);

  const run = () => {
    if (!ready || active || closed) return;
    active = queue.shift() ?? null;
    if (active) {
      send({ type: "query", id: active.id, query: active.query });
    }
  };

  /* Every failure path leads here, including a worker event and the timer, so
     the reason is read rather than trusted: only a missing artifact carries one. */
  const fail = (reason?: unknown) => {
    if (closed) return;
    closed = true;
    clearTimeout(timeout);
    download.abort();
    worker.terminate();
    if (shared === runtime) shared = null;

    const error =
      reason instanceof SearchIndexReplaced
        ? reason
        : new Error("The search engine is unavailable.");
    active?.finish(null, error);
    active = null;
    for (const pending of queue.splice(0)) pending.finish(null, error);
  };

  const timeout = setTimeout(fail, 30_000);

  worker.onmessage = ({ data }: MessageEvent<SearchWorkerResponse>) => {
    if (closed) return;
    if (data.type === "ready") {
      clearTimeout(timeout);
      ready = true;
      run();
    } else if (data.type === "answer" && active?.id === data.id) {
      active.finish(data.answer);
      active = null;
      run();
    } else {
      fail();
    }
  };
  worker.onerror = (event) => {
    event.preventDefault();
    fail();
  };
  worker.onmessageerror = fail;

  const fetchAsset = async (url: string) => {
    const response = await fetch(url, { signal: download.signal });
    if (response.status === 404) {
      throw new SearchIndexReplaced("The search index has been replaced.");
    }
    if (!response.ok) throw new Error("The search asset did not load.");
    return response.arrayBuffer();
  };

  /* Downloads overlap worker startup. Transfer ownership so the page retains
     no copy of the corpus after initialization. */
  Promise.all([
    fetchAsset("/search/ljoss-search.wasm"),
    fetchAsset(
      `/blog/search-index/${process.env.NEXT_PUBLIC_LEDGER_SEARCH_VERSION}.bin`
    ),
  ])
    .then(([module, index]) => {
      if (!closed) send({ type: "initialize", module, index }, [module, index]);
    })
    .catch(fail);

  const runtime: SearchRuntime = {
    search(query, signal) {
      if (signal?.aborted) return Promise.resolve(null);
      if (closed)
        return Promise.reject(new Error("The search engine is unavailable."));

      return new Promise((resolve, reject) => {
        let settled = false;
        const pending: PendingQuery = {
          id: ++nextId,
          query,
          finish(answer, error) {
            if (settled) return;
            settled = true;
            signal?.removeEventListener("abort", cancel);
            if (error) reject(error);
            else resolve(answer);
          },
        };
        const cancel = () => {
          const at = queue.indexOf(pending);
          if (at >= 0) queue.splice(at, 1);
          pending.finish(null);
        };

        /* A field cancels its previous request before it submits another.
           An active query finishes in the worker, but its answer is discarded. */
        signal?.addEventListener("abort", cancel, { once: true });
        queue.push(pending);
        run();
      });
    },
  };

  return runtime;
}

/**
 * Starts the worker and both downloads before a query exists.
 *
 * Focus is the earliest deliberate signal a reader gives, and the artifacts are
 * the long part of a first answer: on a slow connection they take over a second,
 * against single-digit milliseconds for the query itself. Warming moves that
 * wait in front of the first keystroke instead of after it. A visit that never
 * reaches the field still downloads nothing, and a failed warm clears the shared
 * slot, so the first query starts a fresh runtime.
 */
export function warmLedger(): void {
  shared ??= createRuntime();
}

/** A cancelled query resolves to null. Runtime failures reject and permit retry. */
export async function searchLedger(
  query: string,
  signal?: AbortSignal
): Promise<LedgerAnswer | null> {
  if (!query.trim() || signal?.aborted) return null;
  if (query.length > MAX_QUERY_LENGTH) {
    throw new RangeError(
      `Search queries cannot exceed ${MAX_QUERY_LENGTH} characters.`
    );
  }
  shared ??= createRuntime();
  return shared.search(query, signal);
}
