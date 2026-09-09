/* Written by the prebuild step, which is what puts the digest of this build's
   index into the bundle that fetches it. Relative because the file is generated
   and the module graph is the whole point: change the artifacts and every page
   that reads them is rebuilt against their new addresses. */
import {
  BODY_URL,
  INDEX_URL,
  POSTINGS_URL,
} from "../../generated/ledger-search.mjs";
import type {
  LedgerAnswer,
  LedgerRange,
  LedgerSection,
} from "@/lib/ledger-search/engine";
import type {
  LedgerWindow,
  SearchWorkerRequest,
  SearchWorkerResponse,
} from "@/lib/ledger-search/protocol";

/** Each query word expands its own postings. Bound work in the shared worker. */
export const MAX_QUERY_LENGTH = 512;

/**
 * Rejects a query whose artifacts are gone from the server.
 *
 * The artifact URL carries a digest of the index bytes, and a build keeps only
 * the artifacts it wrote, so a 404 means a newer build has replaced this one.
 * Editing the query cannot reach the new address, because the old one is
 * compiled into the script the page is already running. Only a fresh document
 * does.
 */
export class SearchIndexReplaced extends Error {}

interface PendingQuery {
  id: number;
  query: string;
  /* Aborted when the field supersedes this query, which also abandons any
     reading text still in flight for it. */
  windows: AbortController;
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

  /* Releases a query the page has stopped waiting for, so the next keystroke
     starts at once instead of behind a round trip nobody wants. The worker
     keeps no state between passes, so it needs no telling: its reply arrives
     under an id that is no longer active and is dropped. */
  const abandon = (pending: PendingQuery, error?: Error) => {
    pending.finish(null, error);

    if (active === pending) {
      active = null;
      run();
    }
  };

  worker.onmessage = ({ data }: MessageEvent<SearchWorkerResponse>) => {
    if (closed) return;

    if (data.type === "ready") {
      clearTimeout(timeout);
      ready = true;
      run();
      return;
    }

    if (data.type === "error") {
      fail();
      return;
    }

    /* A reply for a query the page has moved on from is stale, not a fault. */
    if (active?.id !== data.id) return;

    if (data.type === "request") {
      void supply(active, data.section, data.ranges);
    } else {
      active.finish(data.answer);
      active = null;
      run();
    }
  };
  worker.onerror = (event) => {
    event.preventDefault();
    fail();
  };
  worker.onmessageerror = fail;

  const fetchAsset = async (
    url: string,
    options: { headers?: HeadersInit; signal?: AbortSignal } = {}
  ) => {
    const response = await fetch(url, {
      headers: options.headers,
      signal: options.signal ?? download.signal,
    });
    if (response.status === 404) {
      throw new SearchIndexReplaced("The search index has been replaced.");
    }
    if (!response.ok) throw new Error("The search asset did not load.");
    return response;
  };

  /**
   * Fetches the bytes one query asked for and hands them back.
   *
   * The two artifacts fail differently, and the difference is the reader's.
   * Without a window of reading text a row loses its quoted line and keeps
   * everything else, so what arrived goes back and the worker prints from it.
   * Without a posting list nothing can be ranked at all, and an answer built
   * from what arrived would read as "no entries match" when the truth is that
   * the lookup could not be done: that query is abandoned and reported.
   *
   * A host that ignores the header answers 200 with the whole artifact, which
   * is correct and self-healing: supplied at offset zero it covers every later
   * range, so the file is read once rather than never being reachable.
   */
  const supply = async (
    pending: PendingQuery,
    section: LedgerSection,
    ranges: LedgerRange[]
  ) => {
    const url = section === "postings" ? POSTINGS_URL : BODY_URL;
    const settled = await Promise.allSettled(
      ranges.map(async ({ start, length }) => {
        const response = await fetchAsset(url, {
          headers: { Range: `bytes=${start}-${start + length - 1}` },
          signal: pending.windows.signal,
        });

        return {
          bytes: await response.arrayBuffer(),
          start: response.status === 206 ? start : 0,
        };
      })
    );

    /* A replaced artifact retires the whole runtime, because every address
       this page holds was compiled into the script it is running. */
    const replaced = settled.find(
      (window) =>
        window.status === "rejected" &&
        window.reason instanceof SearchIndexReplaced
    );
    if (replaced?.status === "rejected") return fail(replaced.reason);

    if (closed || active !== pending) return;

    const windows: LedgerWindow[] = settled.flatMap((window) =>
      window.status === "fulfilled" ? [window.value] : []
    );

    if (pending.windows.signal.aborted) {
      abandon(pending);
      return;
    }

    if (section === "postings" && windows.length < ranges.length) {
      abandon(pending, new Error("The search asset did not load."));
      return;
    }

    send(
      {
        type: "supply",
        id: pending.id,
        query: pending.query,
        section,
        windows,
        /* The reading text is the last thing a query asks for, so once it has
           been supplied the worker is told to print with what it has. */
        more: section === "postings",
      },
      windows.map((window) => window.bytes)
    );
  };

  /* Downloads overlap worker startup. Transfer ownership so the page retains
     no copy of the corpus after initialization. */
  Promise.all(
    ["/search/ljoss-search.wasm", INDEX_URL].map((url) =>
      fetchAsset(url).then((response) => response.arrayBuffer())
    )
  )
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
          windows: new AbortController(),
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
          /* Bytes still arriving for this query are no longer wanted, and the
             next keystroke should not queue behind their round trip. */
          pending.windows.abort();
          abandon(pending);
        };

        /* A field cancels its previous request before it submits another. */
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
