import assert from "node:assert/strict";
import test from "node:test";
import puppeteer from "puppeteer";

const baseURL = process.env.HEX_DIFF_BASE_URL ?? "http://localhost:3000";
const article = `${baseURL}/blog/posts/the-object-already-knows-its-own-name#rtti-briefly`;

for (const browserName of ["chrome", "firefox"]) {
  test(`${browserName} reloads hydrate buttons without restoring stale disabled states`, async () => {
    const browser = await puppeteer.launch({
      browser: browserName,
      headless: true,
    });
    try {
      const page = await browser.newPage();
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

      // Firefox restores dynamic button states on ordinary reloads. Keep the
      // cache enabled and reuse the page so this exercises that restoration.
      await page.goto(article, { waitUntil: "networkidle2", timeout: 120000 });
      for (let visit = 0; visit < 3; visit++) {
        await page.waitForSelector('.hex-diff[data-interactive="true"]');
        assert.deepEqual(errors, [], `hydration errors on visit ${visit + 1}`);
        assert.equal(
          await page.$$eval(".hex-diff button:disabled", (buttons) =>
            buttons.map((button) => button.textContent.trim()).join(", ")
          ),
          "Clear selection"
        );
        assert.equal(
          await page.$$eval(
            '.hex-diff-field[aria-pressed="true"]',
            (buttons) => buttons.length
          ),
          0
        );

        await page.click(
          '.hex-diff [data-version="before"] [data-field="visibility-load:field-offset"]'
        );
        await page.waitForSelector(
          ".hex-diff-inspection-tools button:not(:disabled)"
        );
        if (visit < 2) {
          await page.reload({ waitUntil: "networkidle2", timeout: 120000 });
        } else {
          await page.click(".hex-diff-inspection-tools button");
          await page.waitForSelector(
            ".hex-diff-inspection-tools button:disabled"
          );
          assert.deepEqual(errors, []);
        }
      }
    } finally {
      await browser.close();
    }
  });
}
