import assert from "node:assert/strict";
import test from "node:test";

/* The same module the client reads, written by the prebuild step. The test
   suite runs it first, so these are the addresses of a real build. */
import {
  BODY_URL,
  INDEX_URL,
  POSTINGS_URL,
} from "../../generated/ledger-search.mjs";

let revision = 0;
const answer = { total: 1, results: [], repairs: [] };
const tick = () => new Promise((resolve) => setImmediate(resolve));

async function harness(context, options = {}) {
  const workers = [];
  const requests = [];
  const ranges = [];
  class FakeWorker {
    messages = [];
    terminated = false;
    constructor() {
      workers.push(this);
    }
    postMessage(message) {
      this.messages.push(message);
    }
    terminate() {
      this.terminated = true;
    }
    receive(data) {
      this.onmessage({ data });
    }
  }

  const originalWorker = globalThis.Worker;
  globalThis.Worker = FakeWorker;
  context.after(() => {
    if (originalWorker) globalThis.Worker = originalWorker;
    else delete globalThis.Worker;
  });
  context.mock.method(globalThis, "fetch", async (url, init) => {
    requests.push(url);
    if (init?.headers?.Range) ranges.push(init.headers.Range);
    if (init?.signal?.aborted) throw new Error("aborted");
    if (options.status && String(url).includes(options.forURL ?? "")) {
      return new Response(null, { status: options.status });
    }
    return new Response(new Uint8Array([1, 2, 3]));
  });
  const { searchLedger, warmLedger, SearchIndexReplaced, MAX_QUERY_LENGTH } =
    await import(`./client.ts?test=${++revision}`);
  return {
    workers,
    requests,
    ranges,
    searchLedger,
    warmLedger,
    SearchIndexReplaced,
    MAX_QUERY_LENGTH,
  };
}

test("blank or cancelled input does not start the shared runtime", async (context) => {
  const { workers, requests, searchLedger } = await harness(context);
  const controller = new AbortController();
  controller.abort();
  assert.equal(await searchLedger("   "), null);
  assert.equal(await searchLedger("camera", controller.signal), null);
  assert.equal(workers.length, 0);
  assert.equal(requests.length, 0);
});

test("oversized queries fail before any worker or asset request", async (context) => {
  const { workers, requests, searchLedger, MAX_QUERY_LENGTH } =
    await harness(context);
  await assert.rejects(
    searchLedger("a".repeat(MAX_QUERY_LENGTH + 1)),
    RangeError
  );
  assert.equal(workers.length, 0);
  assert.equal(requests.length, 0);
});

test("fields share initialization and cancel only their own superseded queries", async (context) => {
  const { workers, requests, searchLedger } = await harness(context);
  const first = new AbortController();
  const cancelled = searchLedger("cam", first.signal);
  const otherField = searchLedger("vtable");
  first.abort();
  const latest = searchLedger("camera");
  await tick();

  assert.equal(await cancelled, null);
  assert.equal(workers.length, 1);
  assert.equal(requests.length, 2);
  const worker = workers[0];
  assert.deepEqual(
    worker.messages.map((message) => message.type),
    ["initialize"]
  );
  worker.receive({ type: "ready" });
  assert.equal(worker.messages.at(-1).query, "vtable");
  worker.receive({ type: "answer", id: worker.messages.at(-1).id, answer });
  assert.deepEqual(await otherField, answer);
  assert.equal(worker.messages.at(-1).query, "camera");
  worker.receive({ type: "answer", id: worker.messages.at(-1).id, answer });
  assert.deepEqual(await latest, answer);
});

test("a superseded query is dropped at once so the next one never waits", async (context) => {
  const { workers, searchLedger } = await harness(context);
  const first = new AbortController();
  const second = new AbortController();
  const old = searchLedger("c", first.signal);
  await tick();
  const worker = workers[0];
  worker.receive({ type: "ready" });
  const activeId = worker.messages.at(-1).id;

  first.abort();
  const skipped = searchLedger("ca", second.signal);
  second.abort();
  const latest = searchLedger("camera");
  await tick();

  assert.equal(await old, null);
  assert.equal(await skipped, null);

  /* A query the field has replaced is released without a reply, so each
     keystroke reaches the worker instead of queueing behind the round trip
     of the one before it. */
  assert.deepEqual(
    worker.messages
      .filter((message) => message.type === "query")
      .map((message) => message.query),
    ["c", "ca", "camera"]
  );

  /* An answer that arrives for one of them is stale, and is dropped rather
     than published against the query on screen. */
  worker.receive({
    type: "answer",
    id: activeId,
    answer: { total: 99, results: [], repairs: [] },
  });
  worker.receive({ type: "answer", id: worker.messages.at(-1).id, answer });
  assert.deepEqual(await latest, answer);
});

test("worker failure rejects waiting fields and a later query starts a fresh runtime", async (context) => {
  const { workers, requests, searchLedger } = await harness(context);
  const first = searchLedger("camera");
  const second = searchLedger("vtable");
  const rejected = Promise.all([
    assert.rejects(first, /unavailable/),
    assert.rejects(second, /unavailable/),
  ]);
  await tick();
  workers[0].receive({ type: "error" });
  await rejected;
  assert.equal(workers[0].terminated, true);

  const retry = searchLedger("camera");
  await tick();
  assert.equal(workers.length, 2);
  assert.equal(requests.length, 4);
  const worker = workers[1];
  worker.receive({ type: "ready" });
  worker.receive({ type: "answer", id: worker.messages.at(-1).id, answer });
  assert.deepEqual(await retry, answer);
});

test("focus starts the worker and both downloads without a query", async (context) => {
  const { workers, requests, warmLedger } = await harness(context);
  warmLedger();
  warmLedger();
  await tick();

  assert.equal(workers.length, 1);
  assert.deepEqual(requests, ["/search/ljoss-search.wasm", INDEX_URL]);
  const worker = workers[0];
  const sent = () => worker.messages.map((message) => message.type);
  assert.deepEqual(sent(), ["initialize"]);

  /* The page owns every request, so the worker is handed bytes, not a URL. */
  assert.equal(worker.messages[0].body, undefined);

  /* Readiness arrives with nothing waiting, and no query is invented for it. */
  worker.receive({ type: "ready" });
  assert.deepEqual(sent(), ["initialize"]);
});

test("a query after a warm start reuses the same runtime and downloads", async (context) => {
  const { workers, requests, searchLedger, warmLedger } =
    await harness(context);
  warmLedger();
  await tick();
  workers[0].receive({ type: "ready" });

  const first = searchLedger("camera");
  await tick();
  assert.equal(workers.length, 1);
  assert.equal(requests.length, 2);
  const worker = workers[0];
  assert.equal(worker.messages.at(-1).query, "camera");
  worker.receive({ type: "answer", id: worker.messages.at(-1).id, answer });
  assert.deepEqual(await first, answer);
});

test("a failed warm start leaves no runtime behind and rejects nobody", async (context) => {
  const { workers, requests, searchLedger, warmLedger } =
    await harness(context);
  warmLedger();
  await tick();
  workers[0].receive({ type: "error" });
  assert.equal(workers[0].terminated, true);

  warmLedger();
  await tick();
  assert.equal(workers.length, 2);
  assert.equal(requests.length, 4);
  const worker = workers[1];
  worker.receive({ type: "ready" });
  const retry = searchLedger("camera");
  await tick();
  worker.receive({ type: "answer", id: worker.messages.at(-1).id, answer });
  assert.deepEqual(await retry, answer);
});

test("a missing index means a newer build replaced this page", async (context) => {
  const { searchLedger, SearchIndexReplaced } = await harness(context, {
    status: 404,
    forURL: INDEX_URL,
  });
  await assert.rejects(searchLedger("camera"), SearchIndexReplaced);
});

test("any other asset failure stays a plain retryable failure", async (context) => {
  const { searchLedger, SearchIndexReplaced } = await harness(context, {
    status: 503,
  });
  await assert.rejects(searchLedger("camera"), (error) => {
    assert.ok(!(error instanceof SearchIndexReplaced));
    assert.match(error.message, /unavailable/);
    return true;
  });
});

test("a query fetches the ranges it asks for and hands them back", async (context) => {
  const { workers, ranges, requests, searchLedger } = await harness(context);
  const answered = searchLedger("camera");
  await tick();
  const worker = workers[0];
  worker.receive({ type: "ready" });
  const asked = worker.messages.at(-1);

  worker.receive({
    type: "request",
    id: asked.id,
    query: asked.query,
    section: "postings",
    ranges: [{ start: 10, length: 3 }],
  });
  await tick();
  await tick();

  /* The postings come first, and the page is still fetching after them. */
  assert.deepEqual(ranges, ["bytes=10-12"]);
  assert.equal(requests.at(-1), POSTINGS_URL);
  const lists = worker.messages.at(-1);
  assert.equal(lists.type, "supply");
  assert.equal(lists.section, "postings");
  assert.equal(lists.more, true);

  worker.receive({
    type: "request",
    id: asked.id,
    query: asked.query,
    section: "body",
    ranges: [
      { start: 40, length: 3 },
      { start: 80, length: 3 },
    ],
  });
  await tick();
  await tick();

  /* The windows come second, and they are the last thing asked for. */
  assert.deepEqual(ranges, ["bytes=10-12", "bytes=40-42", "bytes=80-82"]);
  assert.equal(requests.at(-1), BODY_URL);
  const windows = worker.messages.at(-1);
  assert.equal(windows.type, "supply");
  assert.equal(windows.section, "body");
  assert.equal(windows.more, false);
  assert.deepEqual(
    windows.windows.map((window) => window.start),
    /* The mock answers 200 rather than 206, which the page reads as the whole
       artifact and supplies at its start. */
    [0, 0]
  );

  worker.receive({ type: "answer", id: asked.id, answer });
  assert.deepEqual(await answered, answer);
});

test("an artifact that is gone means a newer build replaced this page", async (context) => {
  const { workers, searchLedger, SearchIndexReplaced } = await harness(context, {
    status: 404,
    forURL: POSTINGS_URL,
  });
  const rejected = assert.rejects(searchLedger("camera"), SearchIndexReplaced);
  await tick();
  const worker = workers[0];
  worker.receive({ type: "ready" });
  const asked = worker.messages.at(-1);

  worker.receive({
    type: "request",
    id: asked.id,
    query: asked.query,
    section: "postings",
    ranges: [{ start: 10, length: 3 }],
  });
  await rejected;
  assert.equal(worker.terminated, true);
});

test("a posting list that cannot be read fails the query rather than emptying it", async (context) => {
  const { workers, searchLedger } = await harness(context, {
    status: 503,
    forURL: POSTINGS_URL,
  });
  const failed = searchLedger("camera");
  await tick();
  const worker = workers[0];
  worker.receive({ type: "ready" });
  const asked = worker.messages.at(-1);

  worker.receive({
    type: "request",
    id: asked.id,
    query: asked.query,
    section: "postings",
    ranges: [{ start: 10, length: 3 }],
  });

  /* Nothing ranks without them, so "no entries match" would be a lie. The
     runtime survives, because the next keystroke may well succeed. */
  await assert.rejects(failed, /did not load/);
  assert.equal(worker.terminated, false);

  const retried = searchLedger("vtable");
  await tick();
  assert.equal(worker.messages.at(-1).query, "vtable");
  worker.receive({ type: "answer", id: worker.messages.at(-1).id, answer });
  assert.deepEqual(await retried, answer);
});

test("an abandoned query releases the worker for the keystroke after it", async (context) => {
  const { workers, requests, searchLedger } = await harness(context);
  const superseded = new AbortController();
  const abandoned = searchLedger("cam", superseded.signal);
  await tick();
  const worker = workers[0];
  worker.receive({ type: "ready" });
  const asked = worker.messages.at(-1);
  const before = requests.length;

  superseded.abort();
  assert.equal(await abandoned, null);

  /* The next query goes out at once rather than behind a round trip nobody is
     waiting for, and no bytes are fetched for the query that was dropped. */
  const latest = searchLedger("camera");
  await tick();
  assert.equal(worker.messages.at(-1).query, "camera");

  worker.receive({
    type: "request",
    id: asked.id,
    query: asked.query,
    section: "postings",
    ranges: [{ start: 10, length: 3 }],
  });
  await tick();
  assert.equal(requests.length, before);

  worker.receive({ type: "answer", id: worker.messages.at(-1).id, answer });
  assert.deepEqual(await latest, answer);
});
