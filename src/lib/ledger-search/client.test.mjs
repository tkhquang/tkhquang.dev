import assert from "node:assert/strict";
import test from "node:test";

let revision = 0;
const answer = { total: 1, results: [] };
const tick = () => new Promise((resolve) => setImmediate(resolve));

async function harness(context, options = {}) {
  const workers = [];
  const requests = [];
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
  context.mock.method(globalThis, "fetch", async (url) => {
    requests.push(url);
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

test("an active query finishes before the latest queued query and cannot publish a stale answer", async (context) => {
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

  assert.equal(await old, null);
  assert.equal(await skipped, null);
  assert.equal(worker.messages.at(-1).id, activeId);
  worker.receive({ type: "answer", id: activeId, answer });
  assert.equal(worker.messages.at(-1).query, "camera");
  worker.receive({ type: "answer", id: worker.messages.at(-1).id, answer });
  assert.deepEqual(await latest, answer);
  assert.equal(
    worker.messages.filter((message) => message.type === "query").length,
    2
  );
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
  assert.equal(requests.length, 2);
  const worker = workers[0];
  const sent = () => worker.messages.map((message) => message.type);
  assert.deepEqual(sent(), ["initialize"]);

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
    forURL: "/blog/search-index/",
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
