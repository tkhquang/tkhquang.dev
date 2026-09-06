import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import puppeteer from "puppeteer";

const baseURL = process.env.HEX_DIFF_BASE_URL ?? "http://localhost:3000";
const article = `${baseURL}/blog/posts/the-object-already-knows-its-own-name`;
const beforeBytes = "48 8B 45 5F 0F B6 40 1C 3C 03";
const afterBytes = "48 8B 45 5F 0F B6 40 20 3C 03";
const field = (key, version = "before") =>
  `.hex-diff [data-version="${version}"] [data-field="visibility-load:${key}"]`;
let browser;

before(async () => {
  browser = await puppeteer.launch({ headless: true });
});
after(async () => {
  await browser?.close();
});

async function openArticle(options = {}) {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  if (options.javaScript === false) await page.setJavaScriptEnabled(false);
  await page.setViewport({ width: 1360, height: 1000 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|hydrated|nesting/i.test(message.text())
    ) {
      errors.push(message.text());
    }
  });
  const response = await page.goto(article, {
    waitUntil: "networkidle2",
    timeout: 120000,
  });
  assert.equal(response.status(), 200);
  await page.waitForSelector(
    options.javaScript === false
      ? ".hex-diff"
      : '.hex-diff[data-interactive="true"]'
  );
  return { page, errors };
}

async function activeKey(page) {
  return page.$eval(
    '.hex-diff-field[data-active="true"]',
    (el) => el.dataset.field
  );
}

test("the real Markdown article renders valid, accessible HTML and exact changed bytes", async () => {
  const { page, errors } = await openArticle();
  try {
    const result = await page.$eval(".hex-diff", (figure) => ({
      parent: figure.parentElement.tagName,
      rawTags: document.querySelectorAll("hex-diff").length,
      captionIsLast: figure.lastElementChild.tagName === "FIGCAPTION",
      following: figure.nextElementSibling.textContent,
      changes: [...figure.querySelectorAll('[data-changed="true"]')].map(
        (el) => el.textContent
      ),
      assembly: [...figure.querySelectorAll(".hex-diff-assembly")].map(
        (el) => el.textContent
      ),
    }));
    assert.notEqual(result.parent, "P");
    assert.equal(result.rawTags, 0);
    assert.equal(result.captionIsLast, true);
    assert.match(result.following, /layout drift wearing a code costume/);
    assert.deepEqual(result.changes, ["1C", "20"]);
    assert.deepEqual(result.assembly, [
      "movzx eax, byte ptr [rax+0x1c]",
      "movzx eax, byte ptr [rax+0x20]",
      "cmp al, 3",
      "cmp al, 3",
    ]);
    const client = await page.createCDPSession();
    const { nodes } = await client.send("Accessibility.getFullAXTree");
    const figure = nodes.find(
      (node) =>
        node.role?.value === "figure" && node.name?.value.includes("four bytes")
    );
    assert.ok(figure);
    assert.match(figure.description.value, /1C/);
    const displacement = nodes.find(
      (node) =>
        node.role?.value === "button" &&
        node.name?.value.includes("Displacement, 1C")
    );
    assert.ok(displacement);
    assert.match(displacement.description.value, /28/);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("hover, pinning, keyboard focus, Escape and reset obey inspection precedence", async () => {
  const { page, errors } = await openArticle();
  try {
    const opcode = field("opcode");
    const addressing = field("addressing");
    await page.hover(opcode);
    assert.equal(await activeKey(page), "visibility-load:opcode");
    await page.click(opcode);
    await page.hover(addressing);
    assert.equal(await activeKey(page), "visibility-load:opcode");

    // Keyboard use starts on the field that the pointer already focused.
    await page.keyboard.press("Space");
    assert.equal(
      await page.$eval(opcode, (el) => el.getAttribute("aria-pressed")),
      "false"
    );
    await page.hover(field("field-offset"));
    assert.equal(await activeKey(page), "visibility-load:opcode");
    await page.keyboard.press("Tab");
    assert.equal(await activeKey(page), "visibility-load:addressing");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    assert.equal(
      await page.$eval(addressing, (el) => el.getAttribute("aria-pressed")),
      "false"
    );
    assert.equal(await activeKey(page), "visibility-load:addressing");
    await page.click(field("field-offset"));
    assert.equal(await activeKey(page), "visibility-load:field-offset");
    await page.click(".hex-diff-inspection-tools button");
    assert.equal(
      await page.$$eval(
        '.hex-diff-field[aria-pressed="true"]',
        (els) => els.length
      ),
      0
    );

    // Assistive navigation can move focus without a preceding key event.
    // A completed pointer interaction must not suppress that focus change.
    await page.click(opcode);
    await page.focus(addressing);
    assert.equal(await activeKey(page), "visibility-load:addressing");
    await page.hover(field("field-offset"));
    assert.equal(await activeKey(page), "visibility-load:addressing");

    // Releasing a mouse press outside the field does not dispatch a click.
    await page.click(opcode);
    const box = await (await page.$(opcode)).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x, box.y - 8);
    await page.mouse.up();
    await page.focus(addressing);
    assert.equal(await activeKey(page), "visibility-load:addressing");
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("copy succeeds with exact plain hex and failure leaves manual copy text", async () => {
  const { page } = await openArticle();
  try {
    await page
      .browserContext()
      .overridePermissions(baseURL, [
        "clipboard-read",
        "clipboard-write",
        "clipboard-sanitized-write",
      ]);
    await page.bringToFront();
    for (const [version, expected] of [
      ["before", beforeBytes],
      ["after", afterBytes],
    ]) {
      await page.click(`.hex-diff [aria-label="Copy ${version} bytes"]`);
      await page.waitForFunction(
        (version) => {
          const status = document
            .querySelector(".hex-diff-copy-status")
            .textContent.toLowerCase();
          return (
            status.startsWith(version) || status.includes("copy unavailable")
          );
        },
        {},
        version
      );
      assert.match(
        await page.$eval(".hex-diff-copy-status", (el) => el.textContent),
        /copied/
      );
      assert.equal(
        await page.evaluate(() => navigator.clipboard.readText()),
        expected
      );
    }
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: () => Promise.reject(new Error("Clipboard denied")),
        },
      });
    });
    await page.click('.hex-diff [aria-label="Copy before bytes"]');
    await page.waitForFunction(() =>
      document
        .querySelector(".hex-diff-copy-status")
        .textContent.includes("Copy unavailable")
    );
    await page.click(".hex-diff-breakdown summary");
    assert.deepEqual(
      await page.$$eval(".hex-diff-copy-text code", (els) =>
        els.map((el) => el.textContent)
      ),
      [beforeBytes, afterBytes]
    );
  } finally {
    await page.close();
  }
});

test("themes and narrow layouts preserve correspondence without page overflow", async () => {
  const { page } = await openArticle();
  try {
    for (const theme of ["dark", "light"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const roles = await page.$$eval(".hex-diff-legend [data-role]", (items) =>
        items.map((item) => item.dataset.role)
      );
      for (const role of roles) {
        const selector = `.hex-diff-field[data-role="${role}"]`;
        await page.hover(selector);
        const contrast = await page.$eval(selector, (field) => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const context = canvas.getContext("2d");
          const color = (value, background = "white") => {
            context.clearRect(0, 0, 1, 1);
            context.fillStyle = background;
            context.fillRect(0, 0, 1, 1);
            context.fillStyle = value;
            context.fillRect(0, 0, 1, 1);
            return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
          };
          const luminance = (rgb) =>
            rgb
              .map((value) => {
                const channel = value / 255;
                return channel <= 0.04045
                  ? channel / 12.92
                  : ((channel + 0.055) / 1.055) ** 2.4;
              })
              .reduce(
                (sum, channel, index) =>
                  sum + channel * [0.2126, 0.7152, 0.0722][index],
                0
              );
          const style = getComputedStyle(field);
          const background = getComputedStyle(
            field.closest(".hex-diff")
          ).backgroundColor;
          const foregroundLuminance = luminance(color(style.color));
          const backgroundLuminance = luminance(
            color(style.backgroundColor, background)
          );
          return (
            (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
            (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
          );
        });
        assert.ok(contrast >= 4.5, `${theme}, ${role}: ${contrast}:1 contrast`);
      }
      for (const width of [320, 390, 768, 1024, 1360]) {
        await page.setViewport({ width, height: 1000 });
        const layout = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          aligned: [...document.querySelectorAll(".hex-diff-pair")].every(
            (pair) => {
              const [before, after] = pair.querySelectorAll(".hex-diff-bytes");
              return (
                Math.abs(
                  before.getBoundingClientRect().x -
                    after.getBoundingClientRect().x
                ) < 1
              );
            }
          ),
        }));
        assert.equal(layout.overflow, false, `${theme}, ${width}px`);
        assert.equal(layout.aligned, true, `${theme}, ${width}px`);
      }
    }
    // Doubling the root font exercises text zoom alongside narrow viewports.
    await page.setViewport({ width: 1360, height: 1000 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      true
    );
  } finally {
    await page.close();
  }
});

for (const width of [1360, 390]) {
  test(`hydration preserves the figure height and following hash target at ${width}px`, async () => {
    const page = await browser.newPage();
    let releaseScripts;
    const scriptsReady = new Promise((resolve) => {
      releaseScripts = resolve;
    });
    let holdScripts = true;
    try {
      await page.setCacheEnabled(false);
      await page.setViewport({
        width,
        height: 1000,
        isMobile: width === 390,
        hasTouch: width === 390,
      });
      await page.setRequestInterception(true);
      page.on("request", async (request) => {
        // Keep the native fragment landing separate from hydration, even when
        // local scripts load too quickly to expose the intermediate layout.
        if (
          holdScripts &&
          request.resourceType() === "script" &&
          new URL(request.url()).pathname.startsWith("/_next/")
        ) {
          await scriptsReady;
        }
        if (!request.isInterceptResolutionHandled()) await request.continue();
      });
      const response = await page.goto(`${article}#rtti-briefly`, {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
      assert.equal(response.status(), 200);
      await page.waitForSelector('.hex-diff[data-interactive="false"]');

      const measure = () =>
        page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          );
          const figure = document.querySelector(".hex-diff");
          const target = document.getElementById("rtti-briefly");
          const top = target.getBoundingClientRect().top;
          return {
            figureHeight: figure.getBoundingClientRect().height,
            targetTop: top,
            targetDocumentTop: top + scrollY,
            scrollMargin: parseFloat(getComputedStyle(target).scrollMarginTop),
          };
        });

      const initial = await measure();
      assert.ok(
        Math.abs(initial.targetTop - initial.scrollMargin) <= 1,
        "the native hash target must land below the header before hydration"
      );
      holdScripts = false;
      releaseScripts();
      await page.waitForSelector('.hex-diff[data-interactive="true"]');
      const hydrated = await measure();
      for (const property of [
        "figureHeight",
        "targetTop",
        "targetDocumentTop",
      ]) {
        assert.ok(
          Math.abs(hydrated[property] - initial[property]) <= 1,
          `${property} changed from ${initial[property]} to ${hydrated[property]} during hydration`
        );
      }
    } finally {
      holdScripts = false;
      releaseScripts();
      await page.close();
    }
  });
}

test("touch pins a field using a target at least 44 pixels tall", async () => {
  const page = await browser.newPage();
  try {
    await page.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
    });
    await page.goto(article, { waitUntil: "networkidle2" });
    await page.waitForSelector('.hex-diff[data-interactive="true"]');
    const target = await page.$(field("field-offset", "after"));
    await target.scrollIntoView();
    await target.tap();
    assert.equal(
      await target.evaluate((el) => el.getAttribute("aria-pressed")),
      "true"
    );
    const box = await target.boundingBox();
    assert.ok(box.height >= 44);
    assert.ok(box.width >= 44);
  } finally {
    await page.close();
  }
});

test("without JavaScript the comparison and disclosure remain readable, including print", async () => {
  const { page } = await openArticle({ javaScript: false });
  try {
    assert.equal(
      await page.$eval(".hex-diff", (el) => el.dataset.interactive),
      "false"
    );
    assert.deepEqual(
      await page.$$eval(
        ".hex-diff-tools, .hex-diff-inspection-tools",
        (elements) => elements.map((el) => getComputedStyle(el).display)
      ),
      ["none", "none"]
    );
    assert.match(
      await page.$eval(".hex-diff-caption", (el) => el.textContent),
      /1C/
    );
    await page.click(".hex-diff-breakdown summary");
    assert.equal(
      await page.$eval(".hex-diff-breakdown", (el) => el.open),
      true
    );
    assert.deepEqual(
      await page.$$eval(".hex-diff-copy-text code", (els) =>
        els.map((el) => el.textContent)
      ),
      [beforeBytes, afterBytes]
    );
    await page.click(".hex-diff-breakdown summary");
    await page.emulateMediaType("print");
    assert.equal(
      await page.$eval(
        ".hex-diff-breakdown",
        (el) => getComputedStyle(el, "::details-content").contentVisibility
      ),
      "visible"
    );
    assert.ok(
      await page.$eval(
        ".hex-diff-breakdown-content",
        (el) => el.getBoundingClientRect().height > 0
      )
    );
    assert.equal(
      await page.$eval(".hex-diff-tools", (el) => getComputedStyle(el).display),
      "none"
    );
    assert.equal(
      await page.$eval(
        '[data-changed="true"]',
        (el) => getComputedStyle(el).outlineStyle
      ),
      "solid"
    );
    for (const theme of ["dark", "light"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const printedInk = await page.$$eval(
        ".hex-diff-kicker, .hex-diff-version, .hex-diff-pair-title, .hex-diff-context, .hex-diff-swatch",
        (elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element);
            return element.classList.contains("hex-diff-swatch")
              ? style.borderBottomColor
              : style.color;
          })
      );
      assert.ok(
        printedInk.every((color) => color === "rgb(0, 0, 0)"),
        theme
      );
    }
  } finally {
    await page.close();
  }
});
