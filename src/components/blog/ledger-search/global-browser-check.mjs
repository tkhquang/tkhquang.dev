import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import puppeteer from "puppeteer";

const baseURL = process.env.LEDGER_SEARCH_BASE_URL ?? "http://127.0.0.1:3107";
const trigger = ".global-search__trigger";
const dialog = '.global-search[role="dialog"]';
const field = `${dialog} .ledger-search__field`;
const results = `${dialog} .ledger-search__result`;
const hit = `${dialog} .ledger-search__hit`;
const count = `${dialog} .ledger-search__count`;
const asset = (url) => /\/search\/.*\.(?:wasm|bin)(?:$|\?)/.test(url);
let browser;

before(async () => {
  // Chrome normally hides scrollbars in headless mode. Keep a real gutter so
  // locking the body exercises the width change that moves fixed headers.
  browser = await puppeteer.launch({
    headless: true,
    ignoreDefaultArgs: ["--hide-scrollbars"],
    args: ["--disable-features=OverlayScrollbar"],
  });
});

after(async () => {
  await browser?.close();
});

async function openPage(path = "/", { width = 1440, theme = "light" } = {}) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  await page.setViewport({ width, height: width < 768 ? 844 : 1000 });
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: theme },
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.evaluateOnNewDocument((theme) => {
    localStorage.setItem("theme", theme);
    const OriginalWorker = Worker;
    globalThis.__globalSearchWorkers = 0;
    globalThis.Worker = class extends OriginalWorker {
      constructor(...args) {
        super(...args);
        globalThis.__globalSearchWorkers += 1;
      }
    };
  }, theme);
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
    const url = new URL(request.url());
    if (
      /^https?:/.test(url.protocol) &&
      url.origin !== new URL(baseURL).origin
    ) {
      void request.abort();
      return;
    }
    requests.push(url.href);
    if (url.pathname.startsWith("/api/pageviews")) {
      void request.respond({ contentType: "application/json", body: "{}" });
    } else if (url.pathname.startsWith("/api/spotify")) {
      void request.respond({ contentType: "application/json", body: "false" });
    } else {
      void request.continue();
    }
  });

  try {
    const response = await page.goto(`${baseURL}${path}`, {
      waitUntil: "networkidle2",
      timeout: 120000,
    });
    assert.equal(response.status(), 200);
    await page.waitForSelector(trigger, { visible: true });
    // The Next development toolbar lives outside the app's modal focus scope.
    // It is absent from production and must not enter the product's tab order.
    await page.addStyleTag({
      content: "nextjs-portal { display: none !important; }",
    });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.$eval("html", (root) => root.dataset.theme), theme);
    return { context, page, requests, errors };
  } catch (error) {
    await context.close();
    throw error;
  }
}

async function frames(page, number = 3) {
  await page.evaluate(async (number) => {
    for (let frame = 0; frame < number; frame += 1) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }, number);
}

async function openSearch(page) {
  await page.click(trigger);
  await page.waitForSelector(dialog, { visible: true });
  await page.waitForFunction(
    (selector) => document.activeElement === document.querySelector(selector),
    {},
    field
  );
  await frames(page);
}

async function closed(page) {
  await page.waitForSelector(dialog, { hidden: true });
  await frames(page);
}

async function chord(page, modifier = "Control") {
  await page.keyboard.down(modifier);
  await page.keyboard.press("k");
  await page.keyboard.up(modifier);
  await frames(page);
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
      /\d+ of \d+ entries/.test(document.querySelector(selector)?.textContent),
    {},
    count
  );
}

async function backgroundBounds(page) {
  return page.evaluate((trigger) => {
    const bounds = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      header: bounds("header .container"),
      heading: bounds("main h1, h1"),
      trigger: bounds(trigger),
      theme: bounds("header .toggle-theme"),
      scrollY,
      documentHeight: document.documentElement.scrollHeight,
    };
  }, trigger);
}

function assertStable(before, after) {
  for (const name of ["header", "heading", "trigger", "theme"]) {
    assert.ok(before[name], `${name} exists before opening`);
    assert.ok(after[name], `${name} remains mounted`);
    for (const dimension of ["x", "y", "width", "height"]) {
      assert.ok(
        Math.abs(before[name][dimension] - after[name][dimension]) < 1,
        `${name}.${dimension} shifted from ${before[name][dimension]} to ${after[name][dimension]}`
      );
    }
  }
  assert.ok(
    Math.abs(before.scrollY - after.scrollY) < 1,
    "the document jumped"
  );
  assert.equal(
    after.documentHeight,
    before.documentHeight,
    "document height changed"
  );
}

for (const path of ["/", "/blog/posts"]) {
  test(`${path}: one named header control opens an accessible search and starts the lazy worker`, async () => {
    const run = await openPage(path);
    const { page } = run;
    try {
      assert.equal(
        await page.$$eval(
          trigger,
          (nodes) => nodes.filter((node) => node.getClientRects().length).length
        ),
        1
      );
      assert.equal(await page.evaluate(() => __globalSearchWorkers), 0);
      assert.equal(run.requests.filter(asset).length, 0);
      await openSearch(page);
      await page.waitForFunction(() => __globalSearchWorkers > 0);

      const client = await page.createCDPSession();
      const { nodes } = await client.send("Accessibility.getFullAXTree");
      assert.ok(
        nodes.some(
          (node) =>
            node.role?.value === "dialog" &&
            /^Search the ledger$/i.test(node.name?.value)
        )
      );
      assert.ok(
        nodes.some(
          (node) =>
            node.role?.value === "searchbox" &&
            /^Search the ledger$/i.test(node.name?.value)
        )
      );
      assert.equal(
        await page.$eval(dialog, (node) => node.getAttribute("aria-modal")),
        "true"
      );
      assert.equal(
        await page.$eval(count, (node) => node.getAttribute("role")),
        "status"
      );

      await enterQuery(page, "vtable");
      await waitForResults(page);
      assert.ok(
        (
          await page.$$eval(results, (rows) =>
            rows.map((row) => row.textContent)
          )
        ).some((text) => /vtable/i.test(text))
      );
      const workers = await page.evaluate(() => __globalSearchWorkers);
      await page.keyboard.press("Escape");
      await closed(page);
      assert.equal(
        await page.$eval(trigger, (node) => document.activeElement === node),
        true
      );
      await openSearch(page);
      assert.equal(await page.evaluate(() => __globalSearchWorkers), workers);
      assert.deepEqual(run.errors, []);
    } finally {
      await run.context.close();
    }
  });

  test(`${path}: opening, searching and closing preserve page and header geometry with classic scrollbars`, async () => {
    const run = await openPage(path);
    const { page } = run;
    try {
      const gutter = await page.evaluate(
        () => innerWidth - document.documentElement.clientWidth
      );
      assert.ok(gutter > 0, "this check requires a real scrollbar gutter");
      await page.evaluate(() =>
        window.scrollTo({ top: 200, behavior: "instant" })
      );
      await frames(page, 8);
      const before = await backgroundBounds(page);
      await openSearch(page);
      assertStable(before, await backgroundBounds(page));
      await enterQuery(page, "s");
      await waitForResults(page);
      assertStable(before, await backgroundBounds(page));
      await page.mouse.move(1, 700);
      await page.mouse.wheel({ deltaY: -650 });
      await frames(page, 8);
      assertStable(before, await backgroundBounds(page));
      await page.click(`${dialog} .global-search__close`);
      await closed(page);
      assertStable(before, await backgroundBounds(page));
      await page.mouse.move(700, 700);
      await page.mouse.wheel({ deltaY: -400 });
      await page.waitForFunction(
        (previous) => scrollY < previous - 1,
        {},
        before.scrollY
      );
      assert.deepEqual(run.errors, []);
    } finally {
      await run.context.close();
    }
  });
}

test("keyboard shortcuts open search, Escape closes a filled query, and Tab stays in the dialog", async () => {
  const run = await openPage();
  const { page } = run;
  try {
    for (const modifier of ["Control", "Meta"]) {
      await page.focus(trigger);
      await chord(page, modifier);
      await page.waitForSelector(field, { visible: true });
      await page.waitForFunction(
        (selector) => document.activeElement.matches(selector),
        {},
        field
      );
      await enterQuery(page, "camera");
      await waitForResults(page);

      for (const backwards of [false, true]) {
        // Put focus on either end of the real tab order and cross its boundary.
        await page.$eval(
          dialog,
          (node, backwards) => {
            const controls = [
              ...node.querySelectorAll(
                "a[href], button, input, select, textarea, [tabindex]"
              ),
            ].filter(
              (control) =>
                control.tabIndex >= 0 &&
                !control.disabled &&
                !control.hasAttribute("data-focus-trap") &&
                control.getClientRects().length
            );
            globalThis.__globalSearchFocusDestination = backwards
              ? controls.at(-1)
              : controls[0];
            (backwards ? controls[0] : controls.at(-1)).focus();
          },
          backwards
        );
        if (backwards) await page.keyboard.down("Shift");
        await page.keyboard.press("Tab");
        if (backwards) await page.keyboard.up("Shift");
        await frames(page);
        assert.equal(
          await page.$eval(dialog, (node) =>
            node.contains(document.activeElement)
          ),
          true
        );
        assert.equal(
          await page.evaluate(
            () => document.activeElement === __globalSearchFocusDestination
          ),
          true,
          "Tab wraps to the opposite end of the dialog's tab order"
        );
      }

      await page.focus(field);
      assert.equal(await page.$eval(field, (node) => node.value), "camera");
      await page.keyboard.press("Escape");
      await closed(page);
      assert.equal(
        await page.$eval(trigger, (node) => node === document.activeElement),
        true
      );
    }
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("the global shortcut leaves an archive edit and another dialog alone", async () => {
  const run = await openPage("/blog/posts", { width: 390 });
  const { page } = run;
  try {
    await page.focus(".ledger-search__field");
    await page.keyboard.sendCharacter("camera");
    await chord(page);
    assert.equal(await page.$(dialog), null);
    assert.equal(
      await page.$eval(".ledger-search__field", (node) => node.value),
      "camera"
    );
    assert.equal(
      await page.$eval(
        ".ledger-search__field",
        (node) => node === document.activeElement
      ),
      true
    );

    await page.click('[aria-label="Open the blog index"]');
    await page.waitForSelector('.index-drawer[role="dialog"]', {
      visible: true,
    });
    await chord(page);
    assert.equal(await page.$(dialog), null);
    assert.equal(
      await page.$eval('.index-drawer[role="dialog"]', (node) =>
        node.contains(document.activeElement)
      ),
      true
    );
    await page.keyboard.press("Escape");
    await page.waitForSelector('.index-drawer[role="dialog"]', {
      hidden: true,
    });
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("a no-match query can be cleared and a result closes the persistent blog header dialog", async () => {
  const run = await openPage("/blog/posts");
  const { page } = run;
  try {
    await openSearch(page);
    await enterQuery(page, "zxqvzxqvzxqvzxqv");
    await page.waitForFunction(
      (selector) =>
        document.querySelector(selector)?.textContent === "No entries match",
      {},
      count
    );
    assert.equal(await page.$$eval(results, (rows) => rows.length), 0);
    assert.ok(await page.$(`${dialog} .ledger-search__empty`));
    await page.click(`${dialog} .ledger-search__clear`);
    assert.equal(await page.$eval(field, (node) => node.value), "");
    assert.equal(
      await page.$eval(field, (node) => document.activeElement === node),
      true
    );
    await enterQuery(page, "vtable");
    await waitForResults(page);
    const destination = await page.$eval(
      hit,
      (node) => new URL(node.href).pathname
    );
    await page.click(hit);
    await page.waitForFunction(
      (path) => location.pathname === path,
      { timeout: 120000 },
      destination
    );
    await closed(page);
    await page.waitForSelector(trigger, { visible: true });
    await openSearch(page);
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("an emulated mobile keyboard leaves the field, close control and results in the visible viewport", async () => {
  const run = await openPage("/blog/posts", { width: 320, theme: "dark" });
  const { page } = run;
  try {
    await openSearch(page);
    await enterQuery(page, "s");
    await waitForResults(page);
    const documentPosition = await page.evaluate(() => scrollY);
    // This models the visual viewport resize event, not an actual phone IME.
    // Layout viewport height remains 844px as it does with an overlay keyboard.
    await page.evaluate(() => {
      Object.defineProperty(visualViewport, "height", {
        configurable: true,
        value: 350,
      });
      visualViewport.dispatchEvent(new Event("resize"));
    });
    await frames(page);
    const layout = await page.$eval(dialog, (node) => {
      const bounds = (selector) =>
        node.querySelector(selector).getBoundingClientRect().toJSON();
      return {
        sheet: node.getBoundingClientRect().toJSON(),
        field: bounds(".ledger-search__field"),
        close: bounds(".global-search__close"),
        results: bounds(".ledger-search__body"),
        viewport: visualViewport.height,
        documentPosition: scrollY,
        focused: document.activeElement.matches(".ledger-search__field"),
      };
    });
    for (const name of ["sheet", "field", "close", "results"]) {
      assert.ok(
        layout[name].top >= 0 && layout[name].bottom <= layout.viewport,
        `${name} extends behind the emulated keyboard`
      );
      assert.ok(layout[name].height > 0, `${name} remains visible`);
    }
    assert.ok(
      layout.results.height >= 80,
      "there is enough space to read results"
    );
    assert.equal(layout.documentPosition, documentPosition);
    assert.equal(layout.focused, true);
    await page.$eval(`${dialog} .ledger-search__result:last-child`, (node) =>
      node.scrollIntoView({ block: "end", behavior: "instant" })
    );
    assert.ok(
      await page.$eval(
        `${dialog} .ledger-search__result:last-child`,
        (node) => node.getBoundingClientRect().bottom <= visualViewport.height
      )
    );
    await page.evaluate(() => {
      delete visualViewport.height;
      visualViewport.dispatchEvent(new Event("resize"));
    });
    await frames(page);
    assert.ok(
      await page.$eval(
        dialog,
        (node) => node.getBoundingClientRect().height > 700
      )
    );
    await page.click(`${dialog} .global-search__close`);
    await closed(page);
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

test("opening a result in another tab keeps the current search available", async () => {
  const run = await openPage("/blog/posts");
  const { page } = run;
  try {
    await openSearch(page);
    await enterQuery(page, "vtable");
    await waitForResults(page);
    const destination = await page.$eval(hit, (node) => node.href);
    const newTab = run.context.waitForTarget(
      (target) =>
        target.type() === "page" && target.url().startsWith(destination),
      { timeout: 30000 }
    );
    await page.keyboard.down("Control");
    await page.click(hit);
    await page.keyboard.up("Control");
    const target = await newTab;
    await (await target.page())?.close();
    assert.equal(new URL(page.url()).pathname, "/blog/posts");
    assert.equal(
      await page.$eval(dialog, (node) => node.getClientRects().length > 0),
      true
    );
    assert.equal(await page.$eval(field, (node) => node.value), "vtable");
    assert.deepEqual(run.errors, []);
  } finally {
    await run.context.close();
  }
});

for (const width of [390, 320]) {
  for (const theme of ["light", "dark"]) {
    test(`${width}px ${theme}: both headers fit and the search scrolls inside its viewport`, async () => {
      for (const path of ["/", "/blog/posts"]) {
        const run = await openPage(path, { width, theme });
        const { page } = run;
        try {
          const header = await page.evaluate((trigger) => {
            const controls = [
              ...document.querySelectorAll(
                `header button, header a, ${trigger}`
              ),
            ].filter(
              (node) =>
                node.getClientRects().length &&
                getComputedStyle(node).visibility !== "hidden"
            );
            return {
              viewport: innerWidth,
              width: document.documentElement.scrollWidth,
              controls: controls.map((node) => ({
                label: node.getAttribute("aria-label") ?? node.textContent,
                ...node.getBoundingClientRect().toJSON(),
              })),
            };
          }, trigger);
          assert.ok(
            header.width <= header.viewport,
            `${path}: document overflows`
          );
          for (const control of header.controls) {
            assert.ok(
              control.left >= 0 && control.right <= header.viewport,
              `${path}: ${control.label} leaves the viewport`
            );
            assert.ok(
              control.top >= 0 && control.bottom <= 61,
              `${path}: ${control.label} wraps out of the header`
            );
          }
          await openSearch(page);
          await enterQuery(page, "s");
          await waitForResults(page);
          const layout = await page.$eval(dialog, (node) => {
            const input = node.querySelector(".ledger-search__field");
            return {
              ...node.getBoundingClientRect().toJSON(),
              viewportHeight: innerHeight,
              viewportWidth: innerWidth,
              pageWidth: document.documentElement.scrollWidth,
              fontSize: parseFloat(getComputedStyle(input).fontSize),
              close: node
                .querySelector(".global-search__close")
                .getBoundingClientRect()
                .toJSON(),
              scrollY,
            };
          });
          assert.ok(layout.left >= 0 && layout.right <= layout.viewportWidth);
          assert.ok(layout.top >= 0 && layout.bottom <= layout.viewportHeight);
          assert.ok(
            layout.height >= layout.viewportHeight * 0.8,
            "dialog fills most of the screen"
          );
          assert.ok(layout.pageWidth <= layout.viewportWidth);
          assert.ok(
            layout.fontSize >= 16,
            "input size prevents mobile focus zoom"
          );
          assert.ok(layout.close.width >= 24 && layout.close.height >= 24);

          await page.$eval(
            `${dialog} .ledger-search__result:last-child`,
            (node) => node.scrollIntoView({ block: "end", behavior: "instant" })
          );
          await frames(page);
          const scrolled = await page.$eval(dialog, (node) => ({
            scrollY,
            close: node
              .querySelector(".global-search__close")
              .getBoundingClientRect()
              .toJSON(),
            last: node
              .querySelector(".ledger-search__result:last-child")
              .getBoundingClientRect()
              .toJSON(),
            scrollables: [node, ...node.querySelectorAll("*")].filter(
              (child) => child.scrollTop > 0
            ).length,
          }));
          assert.ok(
            scrolled.scrollables > 0,
            "results have an inner scroll area"
          );
          assert.equal(
            scrolled.scrollY,
            layout.scrollY,
            "reading results scrolled the document"
          );
          assert.ok(
            scrolled.last.bottom <= layout.viewportHeight,
            "the last result can be reached"
          );
          assert.ok(
            scrolled.close.top >= 0 &&
              scrolled.close.bottom <= layout.viewportHeight,
            "close stays reachable"
          );
          await page.click(`${dialog} .global-search__close`);
          await closed(page);
          assert.deepEqual(run.errors, []);
        } finally {
          await run.context.close();
        }
      }
    });
  }
}
