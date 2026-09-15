import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import puppeteer from "puppeteer";

const baseURL = process.env.CONTACT_BASE_URL ?? "http://127.0.0.1:3000";
const form = ".email-form";
const button = `${form} button`;
const draft = {
  name: "Contact browser check",
  email: "contact-check@example.com",
  message: "A draft that stays visible after sending.",
};
let browser;

before(async () => {
  browser = await puppeteer.launch({ headless: true });
});

after(async () => {
  await browser?.close();
});

async function openContact(width, theme, textScale = 1) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: width < 768 ? 844 : 1000 });
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: theme },
    {
      name: "prefers-reduced-motion",
      value: width === 320 ? "reduce" : "no-preference",
    },
  ]);
  await page.evaluateOnNewDocument((theme) => {
    localStorage.setItem("theme", theme);
    const originalFetch = window.fetch.bind(window);
    // The real submission endpoint must never be contacted by this check.
    window.__contactCheck = { requests: [], pending: [] };
    window.fetch = (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url !== "https://api.web3forms.com/submit") {
        return originalFetch(input, init);
      }
      window.__contactCheck.requests.push(JSON.parse(init.body));
      return new Promise((resolve, reject) => {
        window.__contactCheck.pending.push(
          ({ body, status = 200, network }) => {
            if (network) reject(new TypeError("Failed to fetch"));
            else {
              resolve(
                new Response(JSON.stringify(body), {
                  status,
                  headers: { "Content-Type": "application/json" },
                })
              );
            }
          }
        );
      });
    };
  }, theme);
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== new URL(baseURL).origin) return request.abort();
    if (url.pathname.startsWith("/api/pageviews")) {
      return request.respond({ contentType: "application/json", body: "{}" });
    }
    if (url.pathname.startsWith("/api/spotify")) {
      return request.respond({
        contentType: "application/json",
        body: "false",
      });
    }
    return request.continue();
  });
  const response = await page.goto(baseURL, {
    waitUntil: "networkidle2",
    timeout: 120000,
  });
  assert.equal(response.status(), 200);
  await page.waitForSelector(`${form} #message`);
  await page.evaluate(() => document.fonts.ready);
  if (textScale !== 1) {
    await page.evaluate((scale) => {
      const root = document.documentElement;
      root.style.fontSize = `${parseFloat(getComputedStyle(root).fontSize) * scale}px`;
    }, textScale);
  }
  assert.equal(await page.$eval("html", (el) => el.dataset.theme), theme);
  for (const [id, value] of Object.entries(draft)) {
    await page.type(`${form} #${id}`, value);
  }
  // Retain references to verify completion never replaces these elements.
  await page.evaluate((form) => {
    window.__contactNodes = [
      ...document.querySelectorAll(
        `${form} #name, ${form} #email, ${form} #message, ${form} button, ${form} [role="status"], ${form} [role="alert"]`
      ),
    ];
  }, form);
  return page;
}

async function snapshot(page) {
  return page.$eval(form, (form) => {
    const bounds = (element) => {
      const rect = element.getBoundingClientRect();
      return [rect.x, rect.y + window.scrollY, rect.width, rect.height];
    };
    return {
      card: bounds(form),
      button: bounds(form.querySelector("button")),
      message: bounds(form.querySelector("#message")),
      feedback: bounds(form.querySelector('[role="status"]').parentElement),
      section: bounds(form.closest("section")),
      footer: bounds(document.querySelector("footer")),
      pageHeight: document.documentElement.scrollHeight,
      scrollY: window.scrollY,
    };
  });
}

async function assertStable(page, baseline) {
  const current = await snapshot(page);
  for (const key of [
    "card",
    "button",
    "message",
    "feedback",
    "section",
    "footer",
  ]) {
    current[key].forEach((value, index) => {
      assert.ok(
        Math.abs(value - baseline[key][index]) < 0.01,
        `${key}[${index}] shifted: ${baseline[key][index]} -> ${value}`
      );
    });
  }
  assert.equal(current.pageHeight, baseline.pageHeight, "page height changed");
  assert.ok(
    Math.abs(current.scrollY - baseline.scrollY) <= 1,
    "viewport jumped"
  );
  assert.equal(
    await page.evaluate(() =>
      window.__contactNodes.every((node) => node.isConnected)
    ),
    true,
    "original fields, button and live regions remain mounted"
  );
}

async function settle(page, result) {
  await page.evaluate((result) => {
    window.__contactCheck.pending.shift()(result);
  }, result);
}

async function expectButton(page, text) {
  await page.waitForFunction(
    (selector, text) =>
      document.querySelector(selector).textContent.includes(text),
    {},
    button,
    text
  );
}

async function assertFields(page, expected, readOnly) {
  assert.deepEqual(
    await page.$$eval(
      `${form} #name, ${form} #email, ${form} #message`,
      (fields) =>
        fields.map((field) => ({
          id: field.id,
          value: field.value,
          readOnly: field.readOnly,
          disabled: field.disabled,
        }))
    ),
    Object.entries(expected).map(([id, value]) => ({
      id,
      value,
      readOnly,
      disabled: false,
    }))
  );
}

for (const [width, textScale] of [
  [1440, 1],
  [768, 1],
  [390, 1],
  [320, 1],
  [390, 2],
]) {
  for (const theme of ["light", "dark"]) {
    test(`contact preserves layout and draft at ${width}px in ${theme} mode (${textScale * 100}% text)`, async () => {
      const page = await openContact(width, theme, textScale);
      try {
        assert.equal(
          await page.$eval(`${form} [role="status"]`, (el) => el.textContent),
          ""
        );
        assert.equal(
          await page.$eval(`${form} [role="alert"]`, (el) => el.textContent),
          ""
        );
        if (width === 1440) {
          const textarea = await page.$(`${form} #message`);
          await textarea.scrollIntoView();
          const box = await textarea.boundingBox();
          await page.mouse.move(box.x + box.width - 3, box.y + box.height - 3);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width - 3, box.y + box.height + 61);
          await page.mouse.up();
          assert.ok((await textarea.boundingBox()).height > box.height + 40);
        }
        await page.focus(button);
        const baseline = await snapshot(page);
        assert.ok(
          baseline.feedback[3] > 0,
          "feedback space is reserved before submission"
        );
        await page.keyboard.press("Enter");
        await expectButton(page, "Sending");
        await assertFields(page, draft, true);
        await assertStable(page, baseline);
        // Keyboard reactivation and direct submit events cannot send duplicates.
        await page.keyboard.press("Enter");
        await page.$eval(form, (el) => {
          el.requestSubmit();
          el.requestSubmit();
        });
        assert.equal(
          await page.evaluate(() => window.__contactCheck.requests.length),
          1
        );
        await settle(page, { body: { success: true } });
        await expectButton(page, "Send another");
        await assertFields(page, draft, true);
        await assertStable(page, baseline);
        assert.equal(
          await page.$eval(button, (el) => el === document.activeElement),
          true
        );
        const status = await page.$eval(`${form} [role="status"]`, (el) => ({
          text: el.textContent,
          visible: el.checkVisibility(),
          fits: el.scrollHeight <= el.clientHeight + 1,
        }));
        assert.match(
          status.text,
          /Message sent.*Thanks for reaching out.*get back to you/s
        );
        assert.equal(status.visible, true);
        assert.equal(status.fits, true, "wrapped confirmation is not clipped");
        if (width === 1440 && theme === "light") {
          const session = await page.createCDPSession();
          const { nodes } = await session.send("Accessibility.getFullAXTree");
          const liveStatus = nodes.find(
            (node) => node.role?.value === "status" && !node.ignored
          );
          assert.ok(
            liveStatus,
            "confirmation is exposed to assistive technology"
          );
          assert.ok(
            liveStatus.properties.some(
              (property) =>
                property.name === "live" && property.value.value === "polite"
            )
          );
          assert.ok(
            nodes.some((node) => node.name?.value.includes("Message sent."))
          );
          await session.detach();
        }
        assert.equal(
          await page.$eval(form, (el) => el.scrollWidth <= el.clientWidth),
          true
        );
        await page.keyboard.press("Enter");
        await expectButton(page, "Send it");
        await assertFields(page, { ...draft, message: "" }, false);
        assert.equal(
          await page.$eval("#message", (el) => el === document.activeElement),
          true
        );
        // Focus can intentionally scroll the message into view on narrow screens.
        await page.focus(button);
        await assertStable(page, baseline);
        assert.equal(
          await page.evaluate(() => window.__contactCheck.requests.length),
          1
        );
      } finally {
        await page.close();
      }
    });
  }
}

test("failed submissions retain the editable draft and retry directly", async () => {
  const page = await openContact(390, "dark");
  try {
    await page.focus(button);
    const baseline = await snapshot(page);
    const failures = [
      { network: true },
      { status: 503, body: { success: true } },
      { body: { success: false, message: "Rejected by provider" } },
    ];
    for (const [index, failure] of failures.entries()) {
      await page.keyboard.press("Enter");
      await expectButton(page, "Sending");
      await page.waitForFunction(
        (count) => window.__contactCheck.requests.length === count,
        {},
        index + 1
      );
      await settle(page, failure);
      await expectButton(page, "Try again");
      await assertFields(page, draft, false);
      await assertStable(page, baseline);
      assert.match(
        await page.$eval(`${form} [role="alert"]`, (el) => el.textContent),
        /Couldn.t send your message.*try again/s
      );
      assert.equal(
        await page.$eval(button, (el) => el === document.activeElement),
        true
      );
    }
    await page.keyboard.press("Enter");
    await expectButton(page, "Sending");
    await settle(page, { body: { success: true } });
    await expectButton(page, "Send another");
    await assertStable(page, baseline);
    await assertFields(page, draft, true);
    assert.equal(
      await page.$eval(`${form} [role="alert"]`, (el) => el.textContent),
      ""
    );
    const sentDrafts = await page.evaluate(() =>
      window.__contactCheck.requests.map(({ name, email, message }) => ({
        name,
        email,
        message,
      }))
    );
    assert.deepEqual(sentDrafts, Array(4).fill(draft));
  } finally {
    await page.close();
  }
});

test("validation blocks submission and accepts a corrected draft", async () => {
  const page = await openContact(390, "light");
  try {
    await page.$eval(`${form} #message`, (el) => el.select());
    await page.keyboard.press("Backspace");
    await page.click(button);
    await page.waitForFunction(() =>
      document
        .querySelector("#contact-message-error")
        .textContent.includes("Message is required")
    );
    await expectButton(page, "Send it");
    await assertFields(page, { ...draft, message: "" }, false);
    assert.equal(
      await page.evaluate(() => window.__contactCheck.requests.length),
      0,
      "invalid drafts never reach the submission endpoint"
    );
    assert.equal(
      await page.$eval(`${form} [role="status"]`, (el) => el.textContent),
      ""
    );
    assert.equal(
      await page.$eval(
        `${form} #message`,
        (el) => el === document.activeElement
      ),
      true,
      "RHF focuses the invalid field"
    );
    await page.type(`${form} #message`, draft.message);
    await page.click(button);
    await expectButton(page, "Sending");
    await settle(page, { body: { success: true } });
    await expectButton(page, "Send another");
    await assertFields(page, draft, true);
    assert.equal(
      await page.$eval("#contact-message-error", (el) => el.textContent),
      ""
    );
    assert.equal(
      await page.evaluate(() => window.__contactCheck.requests.length),
      1
    );
  } finally {
    await page.close();
  }
});

test("same-task submissions send once and reset sends a fresh second draft", async () => {
  const page = await openContact(390, "dark");
  try {
    await page.$eval(form, (el) => {
      el.requestSubmit();
      el.requestSubmit();
      el.requestSubmit();
    });
    await expectButton(page, "Sending");
    assert.equal(
      await page.evaluate(() => window.__contactCheck.requests.length),
      1,
      "same-task submit events send only one request"
    );
    await settle(page, { body: { success: true } });
    await expectButton(page, "Send another");
    await page.$eval(form, async (el) => {
      el.requestSubmit();
      await new Promise(requestAnimationFrame);
    });
    assert.equal(
      await page.evaluate(() => window.__contactCheck.requests.length),
      1,
      "completed drafts cannot be submitted again"
    );
    await assertFields(page, draft, true);
    await page.focus(button);
    await page.$eval(`${form} #message`, (el) => {
      el.addEventListener(
        "focus",
        () => {
          window.__contactResetFocus = {
            readOnly: el.readOnly,
            value: el.value,
          };
        },
        { once: true }
      );
    });
    await page.keyboard.press("Enter");
    await expectButton(page, "Send it");
    assert.deepEqual(
      await page.evaluate(() => window.__contactResetFocus),
      { readOnly: false, value: "" },
      "the new message is empty and editable when focus fires"
    );
    await assertFields(page, { ...draft, message: "" }, false);
    const secondDraft = { ...draft, message: "A different second message." };
    await page.type(`${form} #message`, secondDraft.message);
    await page.click(button);
    await expectButton(page, "Sending");
    await settle(page, { body: { success: true } });
    await expectButton(page, "Send another");
    await assertFields(page, secondDraft, true);
    assert.deepEqual(
      await page.evaluate(() =>
        window.__contactCheck.requests.map(({ name, email, message }) => ({
          name,
          email,
          message,
        }))
      ),
      [draft, secondDraft],
      "reset retains registered name/email values and submits the new message"
    );
  } finally {
    await page.close();
  }
});
