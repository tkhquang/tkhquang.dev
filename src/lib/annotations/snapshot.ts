import { isLocalHost } from "./parse";
import type { PageSnapshot } from "./types";
import {
  acquireBrowser,
  releaseBrowser,
} from "@/lib/rehype-mermaid-plates/render";
import fs from "fs";
import path from "path";

/* A desktop reading window, and as much of the page below the fold as
   a card is worth scrolling through */
const VIEWPORT = { width: 1280, height: 800 };
const MAX_HEIGHT = 2000;
const LOAD_TIMEOUT_MS = 20_000;

/* The same browser string the annotation fetch sends */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36";

/* Under public, so the site serves its own copy for as long as the site
   stands; the key names the file as it names the card */
const ARCHIVE_PUBLIC_PATH = "/uploads/archive";

/**
 * The site's own frozen copy of a page: the press's headless chromium
 * opens the destination, waits for it to settle, and keeps the first
 * screen and a scroll below it as a webp under public. Throws with a
 * plain reason when the page refuses, times out or answers with an
 * error, so the caller can note the attempt and try again later.
 */
export async function takeSnapshot(
  url: string,
  key: string
): Promise<PageSnapshot> {
  const browser = await acquireBrowser();
  try {
    const page = await browser.newPage();
    try {
      await page.setUserAgent(USER_AGENT);
      await page.setViewport({ ...VIEWPORT, deviceScaleFactor: 1 });
      const response = await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: LOAD_TIMEOUT_MS,
      });
      const status = response?.status() ?? 0;
      if (status >= 400) throw new Error(`the page answered ${status}`);
      /* A public address may redirect to a private one; what answered
         is what counts, and it is not photographed */
      if (isLocalHost(new URL(page.url()).hostname)) {
        throw new Error("the page redirected to a private address");
      }

      /* Lazy pictures below the fold only load once scrolled to, so the
         page is walked to the copy's depth before the shot */
      const height = Math.min(
        MAX_HEIGHT,
        await page.evaluate(() => document.documentElement.scrollHeight)
      );
      await page.evaluate(async (depth: number) => {
        for (let y = 0; y < depth; y += 400) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
        window.scrollTo(0, 0);
      }, height);

      const bytes = await page.screenshot({
        type: "webp",
        quality: 80,
        clip: { x: 0, y: 0, width: VIEWPORT.width, height },
        captureBeyondViewport: true,
      });

      const directory = path.join(process.cwd(), "public", ARCHIVE_PUBLIC_PATH);
      await fs.promises.mkdir(directory, { recursive: true });
      await fs.promises.writeFile(path.join(directory, `${key}.webp`), bytes);

      return {
        src: `${ARCHIVE_PUBLIC_PATH}/${key}.webp`,
        width: VIEWPORT.width,
        height,
        taken: new Date().toISOString(),
      };
    } finally {
      await page.close();
    }
  } finally {
    releaseBrowser();
  }
}
