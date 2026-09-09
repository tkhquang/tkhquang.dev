import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import puppeteer from "puppeteer";

const baseURL = process.env.LEDGER_SEARCH_BASE_URL ?? "http://127.0.0.1:3107";
const archiveURL = `${baseURL}/blog/posts`;
const field = ".ledger-search__field";
const count = ".ledger-search__count";
const results = ".ledger-search__result";
const indexAsset = (url) => /\/search\/[a-f0-9]{64}\.bin(?:$|\?)/.test(url);
/* Neither the postings nor the reading text is fetched whole, so neither is a
   warm-up asset: a query reaches the lists of its own terms, and one window of
   reading text per result it prints. */
const postingsAsset = (url) => /\/search\/[a-f0-9]{64}\.pst(?:$|\?)/.test(url);
const bodyAsset = (url) => /\/search\/[a-f0-9]{64}\.pool(?:$|\?)/.test(url);
const asset = (url) => /\/search\/.*\.wasm/.test(url) || indexAsset(url);
let browser;

before(async () => {
  browser = await puppeteer.launch({ headless: true });
});

after(async () => {
  await browser?.close();
});

/* The probe wraps query exports before worker code starts. This separates
   WASM execution from a worker that only forwards messages. */
function observeWebAssembly() {
  const calls = { instances: 0, queries: [] };
  globalThis.__ledgerWasmCheck = calls;

  const observeInstance = (instance) => {
    calls.instances += 1;
    const original = instance.exports;
    const exports = { ...original };
    if (original.search_query) {
      exports.search_query = (...args) => {
        calls.queries.push(
          new TextDecoder().decode(
            new Uint8Array(original.memory.buffer, args[0], args[1])
          )
        );
        return original.search_query(...args);
      };
    }
    return new Proxy(instance, {
      get(target, key) {
        return key === "exports" ? exports : Reflect.get(target, key, target);
      },
    });
  };

  for (const name of ["instantiate", "instantiateStreaming"]) {
    const original = WebAssembly[name];
    WebAssembly[name] = async (...args) => {
      const result = await Reflect.apply(original, WebAssembly, args);
      return result instanceof WebAssembly.Instance
        ? observeInstance(result)
        : { ...result, instance: observeInstance(result.instance) };
    };
  }
}

async function openArchive(options = {}) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  const failed = [];
  const held = [];
  let holdScripts = options.holdScripts ?? false;
  let holdIndex = options.holdIndex ?? false;
  let failModules = options.failModules ?? 0;

  await page.setViewport(
    options.mobile
      ? { width: 390, height: 844, isMobile: true, hasTouch: true }
      : { width: 1440, height: 1000 }
  );
  if (options.javaScript === false) await page.setJavaScriptEnabled(false);
  await page.evaluateOnNewDocument(observeWebAssembly);
  await page.evaluateOnNewDocument(() => {
    const activity = { created: 0, messages: 0 };
    globalThis.__ledgerWorkerCheck = activity;
    const OriginalWorker = Worker;
    globalThis.Worker = class extends OriginalWorker {
      constructor(...args) {
        super(...args);
        activity.created += 1;
        this.addEventListener("message", () => {
          activity.messages += 1;
        });
      }
    };
  });

  page.on("requestfailed", (request) => failed.push(request.url()));
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|hydrated|nesting/i.test(message.text())
    ) {
      errors.push(message.text());
    }
  });
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = request.url();
    if (
      /^https?:/.test(url) &&
      new URL(url).origin !== new URL(baseURL).origin
    ) {
      void request.abort();
      return;
    }
    requests.push({
      url,
      type: request.resourceType(),
      prefetch: Boolean(request.headers()["next-router-prefetch"]),
      range: request.headers().range,
    });
    if (
      (holdIndex && indexAsset(url)) ||
      (holdScripts && request.resourceType() === "script")
    ) {
      held.push(request);
    } else if (failModules > 0 && /\/search\/.*\.wasm/.test(url)) {
      failModules -= 1;
      void request.abort();
    } else {
      void request.continue();
    }
  });

  if (options.observeWorker) {
    const client = await page.createCDPSession();
    client.on("Target.attachedToTarget", async (event) => {
      if (event.targetInfo.type !== "worker") return;
      const worker = client.connection().session(event.sessionId);
      try {
        await worker.send("Runtime.enable");
        await worker.send("Runtime.evaluate", {
          expression: `(${observeWebAssembly.toString()})()`,
        });
      } catch (error) {
        errors.push(error.message);
      } finally {
        await worker.send("Runtime.runIfWaitingForDebugger");
      }
    });
    await client.send("Target.setAutoAttach", {
      autoAttach: true,
      waitForDebuggerOnStart: true,
      flatten: true,
    });
  }

  const response = await page.goto(archiveURL, {
    waitUntil: holdScripts ? "domcontentloaded" : "networkidle0",
    timeout: 120000,
  });
  assert.equal(response.status(), 200);
  await page.waitForSelector(field);

  return {
    context,
    page,
    requests,
    errors,
    failed,
    held,
    async release() {
      holdScripts = false;
      holdIndex = false;
      await Promise.all(held.splice(0).map((request) => request.continue()));
    },
  };
}

/* Puppeteer never reports network idle after a cancelled request, so a scenario
   that waits on a failure polls the condition it actually needs. */
async function settles(check, what) {
  for (let waited = 0; waited < 15000; waited += 50) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`timed out waiting for ${what}`);
}

async function enterQuery(page, query) {
  await page.focus(field);
  await page.keyboard.down("Control");
  await page.keyboard.press("a");
  await page.keyboard.up("Control");
  if (query) await page.keyboard.sendCharacter(query);
  else await page.keyboard.press("Backspace");
}

async function waitForResults(page) {
  await page.waitForSelector(results);
  await page.waitForFunction(
    (selector) =>
      /\d+ of \d+ entries/.test(document.querySelector(selector).textContent),
    {},
    count
  );
}

async function visibleArchiveLinks(page) {
  return page.$$eval(".post__list a", (links) =>
    links
      .filter((link) => link.getClientRects().length > 0)
      .map((link) => link.href)
  );
}

async function resultText(page) {
  return page.$$eval(results, (rows) => rows.map((row) => row.textContent));
}

test("focus starts the worker and its downloads, and only a nonblank query searches", async () => {
  const run = await openArchive({ observeWorker: true });
  const { page, requests, errors } = run;
  const assets = () => requests.filter((request) => asset(request.url)).length;
  try {
    assert.equal(assets(), 0);
    assert.equal(await page.evaluate(() => __ledgerWorkerCheck.created), 0);

    /* Focus is the warm signal. The artifacts are the long part of a first
       answer, so they start before a keystroke rather than after one. The page
       counts a message from the worker only once initialization reports ready. */
    await page.focus(field);
    await page.waitForFunction(() => __ledgerWorkerCheck.messages > 0);
    const worker = page.workers()[0];
    assert.ok(worker, "search has a dedicated worker");
    assert.equal(await page.evaluate(() => __ledgerWorkerCheck.created), 1);
    assert.equal(assets(), 2);
    const warmed = await worker.evaluate(() => globalThis.__ledgerWasmCheck);
    assert.equal(warmed.instances, 1);
    assert.deepEqual(warmed.queries, []);

    await enterQuery(page, "   ");
    await page.waitForSelector(".ledger-search__clear");
    assert.deepEqual(
      (await worker.evaluate(() => globalThis.__ledgerWasmCheck)).queries,
      []
    );

    await enterQuery(page, "vtable");
    await waitForResults(page);
    const workerCalls = await worker.evaluate(
      () => globalThis.__ledgerWasmCheck
    );
    assert.equal(workerCalls.instances, 1);
    assert.ok(workerCalls.queries.includes("vtable"));
    assert.deepEqual(await page.evaluate(() => __ledgerWasmCheck), {
      instances: 0,
      queries: [],
    });

    await enterQuery(page, "camera");
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".ledger-search__snippet mark")].some(
        (mark) => /camera/i.test(mark.textContent)
      )
    );
    assert.equal(assets(), 2);
    assert.equal(await page.evaluate(() => __ledgerWorkerCheck.created), 1);
    assert.deepEqual(errors, []);
  } finally {
    await run.context.close();
  }
});

test("text entered before hydration survives and starts its search", async () => {
  const run = await openArchive({ holdScripts: true });
  try {
    await enterQuery(run.page, "vtable");
    assert.equal(await run.page.$eval(field, (input) => input.value), "vtable");
    assert.equal(
      run.requests.filter((request) => asset(request.url)).length,
      0
    );
    await run.release();
    await waitForResults(run.page);
    assert.equal(await run.page.$eval(field, (input) => input.value), "vtable");
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("the same worker and index serve a field after client navigation", async () => {
  const run = await openArchive();
  const { page } = run;
  try {
    await enterQuery(page, "vtable");
    await waitForResults(page);
    const worker = page.workers()[0];
    assert.ok(worker);

    /* The archive is the only room that carries a field, so leaving it and
       coming back remounts the field against the runtime already started. */
    await page.click('.blog-nav__link[href="/blog/categories"]');
    await page.waitForFunction(
      () =>
        location.pathname === "/blog/categories" &&
        !document.querySelector(".ledger-search__field")
    );
    await page.click('.blog-nav__link[href="/blog/posts"]');
    await page.waitForSelector(field);
    await enterQuery(page, "camera");
    await waitForResults(page);

    assert.equal(page.workers()[0], worker);
    assert.equal(await page.evaluate(() => __ledgerWorkerCheck.created), 1);
    assert.equal(
      run.requests.filter((request) => asset(request.url)).length,
      2
    );
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("the compressed index stays in the browser cache across document navigation", async () => {
  const run = await openArchive();
  const { page } = run;
  try {
    const [downloaded] = await Promise.all([
      page.waitForResponse((response) => indexAsset(response.url())),
      enterQuery(page, "vtable"),
    ]);
    await waitForResults(page);
    assert.equal(downloaded.headers()["content-encoding"], "gzip");
    assert.match(downloaded.headers()["cache-control"], /\bimmutable\b/);

    await page.goto(`${baseURL}/blog/categories`, {
      waitUntil: "networkidle0",
    });
    await page.goto(archiveURL, { waitUntil: "networkidle0" });
    const [cached] = await Promise.all([
      page.waitForResponse((response) => indexAsset(response.url())),
      enterQuery(page, "camera"),
    ]);
    await waitForResults(page);
    assert.equal(cached.url(), downloaded.url());
    assert.equal(cached.fromCache(), true);
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("a slow initial load keeps the archive visible and answers the latest query", async () => {
  const run = await openArchive({ holdIndex: true });
  const { page } = run;
  try {
    const before = await visibleArchiveLinks(page);
    assert.ok(before.length > 0);
    await Promise.all([
      page.waitForRequest((request) => indexAsset(request.url())),
      enterQuery(page, "s"),
    ]);
    await page.waitForFunction(
      (selector) =>
        document.querySelector(selector).textContent === "Opening the index",
      {},
      count
    );
    assert.deepEqual(await visibleArchiveLinks(page), before);
    await enterQuery(page, "camera");
    await enterQuery(page, "vtable");
    await run.release();
    await waitForResults(page);
    const latest = await resultText(page);
    await enterQuery(page, "camera");
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".ledger-search__snippet mark")].some(
        (mark) => /camera/i.test(mark.textContent)
      )
    );
    await enterQuery(page, "vtable");
    await page.waitForFunction(
      (expected) =>
        JSON.stringify(
          [...document.querySelectorAll(".ledger-search__result")].map(
            (row) => row.textContent
          )
        ) === JSON.stringify(expected),
      {},
      latest
    );
    assert.deepEqual(await resultText(page), latest);
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("clear during initialization prevents a late answer from replacing the archive", async () => {
  const run = await openArchive({ holdIndex: true });
  const { page } = run;
  try {
    const before = await visibleArchiveLinks(page);
    await Promise.all([
      page.waitForRequest((request) => indexAsset(request.url())),
      enterQuery(page, "s"),
    ]);
    await page.waitForSelector(".ledger-search__clear");
    await page.click(".ledger-search__clear");
    await run.release();
    await page.waitForFunction(() => __ledgerWorkerCheck.messages > 0);
    await page.waitForNetworkIdle({ idleTime: 250 });
    assert.equal(await page.$eval(field, (input) => input.value), "");
    assert.equal(await page.$eval(count, (status) => status.textContent), "");
    assert.equal(await page.$$eval(results, (rows) => rows.length), 0);
    assert.deepEqual(await visibleArchiveLinks(page), before);
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("a failed artifact load preserves the archive and a later edit retries", async () => {
  /* Two failures, because a warm start has no reader waiting on it: the first
     is absorbed silently, and the second belongs to a real query. Each step
     types without leaving the field, so no step warms a runtime the next one
     was going to need. */
  const run = await openArchive({ failModules: 2 });
  const { page } = run;
  const retype = async (query) => {
    await page.keyboard.down("Control");
    await page.keyboard.press("a");
    await page.keyboard.up("Control");
    await page.keyboard.sendCharacter(query);
  };
  try {
    const before = await visibleArchiveLinks(page);

    await page.focus(field);
    await page.waitForFunction(() => __ledgerWorkerCheck.created === 1);

    /* The runtime cancels its own index download on the way out, so an index
       request among the failures proves the whole failure path has run. */
    await settles(
      () => run.failed.some(indexAsset),
      "the warm start to give up"
    );
    assert.equal(await page.$eval(count, (status) => status.textContent), "");
    assert.deepEqual(await visibleArchiveLinks(page), before);

    await retype("vtable");
    await page.waitForFunction(
      (selector) =>
        document.querySelector(selector).textContent ===
        "The lookup is unavailable",
      {},
      count
    );
    assert.equal(await page.evaluate(() => __ledgerWorkerCheck.created), 2);
    assert.deepEqual(await visibleArchiveLinks(page), before);

    await retype("camera");
    await waitForResults(page);
    assert.equal(await page.evaluate(() => __ledgerWorkerCheck.created), 3);
    assert.equal(
      run.requests.filter((request) => /\/search\/.*\.wasm/.test(request.url))
        .length,
      3
    );
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("a pasted phrase keeps the field and the query in step through a full delete", async () => {
  const run = await openArchive();
  const { page } = run;
  try {
    const before = await visibleArchiveLinks(page);
    await page.focus(field);

    /* A newline is what routes the paste through the component instead of the
       browser, so the component writes the field itself from here on. */
    await page.$eval(field, (input) => {
      const carried = new DataTransfer();
      carried.setData("text/plain", "camera\noffsets");
      input.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: carried,
          bubbles: true,
          cancelable: true,
        })
      );
    });
    await page.waitForFunction(
      (selector) => document.querySelector(selector).value === "camera offsets",
      {},
      field
    );
    await waitForResults(page);

    /* Select all and delete. React drops an edit whose result matches the value
       its tracker last saw, so a field written past that tracker goes silent here. */
    await page.keyboard.down("Control");
    await page.keyboard.press("a");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");

    await page.waitForFunction(
      (selector) => document.querySelector(selector).value === "",
      {},
      field
    );
    await page.waitForFunction(
      (selector) => document.querySelector(selector).textContent === "",
      {},
      count
    );
    assert.equal(await page.$$eval(results, (rows) => rows.length), 0);
    assert.equal(await page.$(".ledger-search__clear"), null);
    assert.deepEqual(await visibleArchiveLinks(page), before);
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("the results on screen stay mounted while the next query runs", async () => {
  const run = await openArchive();
  const { page } = run;
  try {
    await enterQuery(page, "camera");
    await waitForResults(page);

    /* Count removals of the list itself rather than sample the DOM, because a
       list that unmounted and came back within one commit is indistinguishable
       from one that never left by the time an observer callback runs. */
    await page.evaluate(() => {
      globalThis.__ledgerListRemovals = 0;
      const list = document.querySelector(".ledger-search__results");
      new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.removedNodes) {
            if (node === list) globalThis.__ledgerListRemovals += 1;
          }
        }
      }).observe(list.parentElement, { childList: true });
    });

    await page.keyboard.sendCharacter(" offsets");
    await page.waitForFunction(
      (selector) =>
        document.querySelector(selector).textContent ===
          "Searching the ledger" ||
        /\d+ of \d+ entries/.test(document.querySelector(selector).textContent),
      {},
      count
    );
    await waitForResults(page);

    assert.equal(await page.evaluate(() => __ledgerListRemovals), 0);
    assert.ok(
      (await resultText(page)).some((row) => /offsets/i.test(row)),
      "the narrower query answered"
    );
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("Escape restores the same open archive groups and keeps focus in the field", async () => {
  const run = await openArchive();
  const { page } = run;
  try {
    const closed = await page.$('section h2 button[aria-expanded="false"]');
    assert.ok(closed);
    await closed.click();
    await page.evaluate((button) => {
      globalThis.__ledgerArchiveTrigger = button;
    }, closed);
    await page.waitForFunction(
      () => __ledgerArchiveTrigger.getAttribute("aria-expanded") === "true"
    );
    const before = await visibleArchiveLinks(page);
    await enterQuery(page, "vtable");
    await waitForResults(page);
    assert.deepEqual(await visibleArchiveLinks(page), []);
    await page.keyboard.press("Escape");
    assert.equal(await page.$eval(field, (input) => input.value), "");
    assert.equal(
      await page.$eval(field, (input) => input === document.activeElement),
      true
    );
    assert.equal(
      await page.evaluate(
        () =>
          __ledgerArchiveTrigger.isConnected &&
          __ledgerArchiveTrigger.getAttribute("aria-expanded") === "true"
      ),
      true
    );
    assert.deepEqual(await visibleArchiveLinks(page), before);
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("result rows do not prefetch post routes when they enter the viewport", async () => {
  const run = await openArchive();
  const { page } = run;
  try {
    run.requests.length = 0;
    await enterQuery(page, "s");
    await waitForResults(page);
    const paths = await page.$$eval(".ledger-search__hit", (links) =>
      links.map((link) => new URL(link.href).pathname)
    );
    for (const link of await page.$$(".ledger-search__hit")) {
      await link.evaluate((element) =>
        element.scrollIntoView({ block: "center" })
      );
    }
    await page.waitForNetworkIdle({ idleTime: 500 });
    assert.deepEqual(
      run.requests.filter(
        (request) =>
          request.prefetch && paths.includes(new URL(request.url).pathname)
      ),
      []
    );
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("the field has an accessible name, a short status, and keyboard links", async () => {
  const run = await openArchive();
  const { page } = run;
  try {
    const client = await page.createCDPSession();
    const { nodes } = await client.send("Accessibility.getFullAXTree");
    assert.ok(
      nodes.some(
        (node) =>
          node.role?.value === "searchbox" &&
          /^Search the ledger$/i.test(node.name?.value)
      )
    );
    assert.equal(
      await page.$eval(count, (status) => status.getAttribute("role")),
      "status"
    );
    await enterQuery(page, "vtable");
    await waitForResults(page);
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() =>
        document.activeElement.getAttribute("aria-label")
      ),
      "Clear the search"
    );
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() =>
        document.activeElement.matches(".ledger-search__hit")
      ),
      true
    );
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("mobile results fit the viewport and the clear control restores focus", async () => {
  const run = await openArchive({ mobile: true });
  const { page } = run;
  try {
    await enterQuery(page, "s");
    await waitForResults(page);
    const layout = await page.$eval(field, (input) => ({
      fontSize: parseFloat(getComputedStyle(input).fontSize),
      viewport: innerWidth,
      contentWidth: document.documentElement.scrollWidth,
      clear: document
        .querySelector(".ledger-search__clear")
        .getBoundingClientRect()
        .toJSON(),
    }));
    assert.ok(layout.fontSize >= 16);
    assert.ok(layout.contentWidth <= layout.viewport);
    assert.ok(layout.clear.width >= 24 && layout.clear.height >= 24);
    await page.tap(".ledger-search__clear");
    assert.equal(await page.$eval(field, (input) => input.value), "");
    assert.equal(
      await page.$eval(field, (input) => input === document.activeElement),
      true
    );
    assert.ok((await visibleArchiveLinks(page)).length > 0);
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("without JavaScript, the archive remains visible and the search stays hidden", async () => {
  const run = await openArchive({ javaScript: false });
  try {
    assert.equal(
      await run.page.$eval(
        ".ledger-search",
        (search) => search.getClientRects().length
      ),
      0
    );
    assert.ok((await visibleArchiveLinks(run.page)).length > 0);
    assert.equal(
      run.requests.filter((request) => asset(request.url)).length,
      0
    );
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("a quoted line is fetched as one small range of the reading text", async () => {
  const run = await openArchive();
  const { page, requests } = run;
  try {
    await enterQuery(page, "vtable");
    await waitForResults(page);

    const windows = requests.filter((request) => bodyAsset(request.url));
    assert.ok(windows.length > 0, "the reading text was never reached");

    for (const request of windows) {
      assert.match(request.range ?? "", /^bytes=\d+-\d+$/);
      const [from, to] = request.range.slice(6).split("-").map(Number);
      assert.ok(to - from < 4096, `a window of ${to - from + 1} bytes`);
    }

    /* The windows are what the marks are cut from, so their arrival is
       visible on the page rather than only in the network log. */
    const marked = await page.$$eval(
      ".ledger-search__snippet mark",
      (nodes) => nodes.map((node) => node.textContent)
    );
    assert.ok(marked.length > 0);
    assert.ok(marked.every((text) => /vtable/i.test(text)));
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("growing a word does not fetch a window already in hand", async () => {
  const run = await openArchive();
  const { page, requests } = run;
  const windows = () => requests.filter((request) => bodyAsset(request.url));
  try {
    await enterQuery(page, "vta");
    await waitForResults(page);

    const opened = windows().length;
    assert.ok(opened > 0, "the reading text was never reached");

    /* Every prefix below reaches the same entries at the same matches, so the
       windows are the windows already held and nothing goes back out. */
    for (const query of ["vtab", "vtabl", "vtable"]) {
      await enterQuery(page, query);
      await waitForResults(page);
    }

    const asked = windows().map((request) => request.range);
    assert.equal(asked.length, opened, "a held window was fetched again");
    assert.deepEqual(asked, [...new Set(asked)], "a window was asked for twice");
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("a prefix reads one range of the postings and its extensions read none", async () => {
  const run = await openArchive();
  const { page, requests } = run;
  const lists = () => requests.filter((request) => postingsAsset(request.url));
  try {
    await enterQuery(page, "vt");
    await waitForResults(page);

    /* Terms sit in dictionary order and their lists were written in that same
       order, so every term beginning with a prefix is one stretch of the file. */
    assert.equal(lists().length, 1, "a prefix cost more than one range");

    for (const query of ["vta", "vtab", "vtabl", "vtable"]) {
      await enterQuery(page, query);
      await waitForResults(page);
    }

    /* That stretch covers every extension of the prefix, so growing the word
       reads nothing further. */
    assert.equal(lists().length, 1, "an extension of a prefix read again");
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("a slip is answered as it is typed and the swap is named", async () => {
  const run = await openArchive();
  const { page } = run;
  const note = ".ledger-search__repair";
  try {
    /* A prefix of a real word needs no repair: it reaches every ending of
       itself, so the expansion answers and the note says nothing. It keeps its
       place in the layout either way, so the results below never move. */
    await enterQuery(page, "chromiu");
    await waitForResults(page);
    const quiet = await page.$eval(note, (node) => ({
      text: node.textContent.trim(),
      height: Math.round(node.getBoundingClientRect().height),
    }));
    assert.equal(quiet.text, "");
    assert.ok(quiet.height > 0, "the note gave up its space");

    /* A prefix of nothing has no expansion to fight, so the nearest word the
       ledger holds answers for it without waiting for a space, and both words
       are named so a deliberate spelling is not silently overruled. */
    await enterQuery(page, "chromiun");
    await waitForResults(page);
    await page.waitForSelector(note);

    const said = await page.$eval(note, (node) => ({
      text: node.textContent.replace(/\s+/g, " ").trim(),
      height: Math.round(node.getBoundingClientRect().height),
    }));
    assert.match(said.text, /chromiun/);
    assert.match(said.text, /chromium/);

    /* The whole point of reserving the line: saying something costs no space
       that saying nothing did not already hold. */
    assert.equal(said.height, quiet.height);
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("two characters the wrong way round are still one edit", async () => {
  const run = await openArchive();
  const { page } = run;
  try {
    /* At six characters the budget is one edit, so this only answers because
       a swap costs one rather than two. */
    await enterQuery(page, "vtabel");
    await waitForResults(page);

    const said = await page.$eval(".ledger-search__repair", (node) =>
      node.textContent.replace(/\s+/g, " ").trim()
    );
    assert.match(said, /vtabel/);
    assert.match(said, /vtable/);
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("the field furniture holds its height through a whole word", async () => {
  const run = await openArchive();
  const { page } = run;
  const measure = () =>
    page.evaluate(() => {
      const results = document.querySelector(".ledger-search__results");
      return {
        furniture: Math.round(
          document.querySelector("search.ledger-search").getBoundingClientRect()
            .height
        ),
        resultsTop: results
          ? Math.round(results.getBoundingClientRect().top)
          : null,
      };
    });
  try {
    /* This word passes through prefixes that match nothing, so the repair note
       comes and goes while it is being typed. Nothing above the results may
       move when it does: a line arriving under a reader's cursor pushes what
       they are reading down the page. */
    const seen = [];
    for (const query of ["0x", "0xC", "0xC0", "0xC00", "0xC000", "0xC0000005"]) {
      await enterQuery(page, query);
      await page.waitForFunction(
        (selector) =>
          /\d+ of \d+ entries|No entries match/.test(
            document.querySelector(selector).textContent
          ),
        {},
        count
      );
      seen.push(await measure());
    }

    const heights = [...new Set(seen.map((state) => state.furniture))];
    assert.deepEqual(heights, [heights[0]], "the furniture changed height");

    const tops = [
      ...new Set(seen.map((state) => state.resultsTop).filter(Boolean)),
    ];
    assert.deepEqual(tops, [tops[0]], "the results moved under the reader");
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});
