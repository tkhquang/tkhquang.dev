import chromium from "@sparticuz/chromium";
import fsPromise from "fs/promises";
import { lookup } from "mime-types";
import path from "path";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import "server-only";

/**
 * Creates and launches a new Puppeteer browser instance with predefined configurations.
 *
 * @returns {Promise<Browser>} A promise that resolves to the launched Puppeteer browser instance.
 *
 * @description
 * - The browser is launched in headless mode with specific flags to optimize performance and security.
 * - Flags include disabling GPU usage, sandboxing, extensions, and other unnecessary features.
 * - Designed for running in controlled environments, such as servers or CI pipelines.
 */
export async function createBrowserInstance(): Promise<Browser> {
  // const browser = await puppeteer.launch({
  //   args: [
  //     "--no-sandbox",
  //     "--disable-setuid-sandbox",
  //     "--disable-dev-shm-usage",
  //     "--disable-gpu",
  //     "--hide-scrollbars",
  //     "--disable-web-security",
  //     "--disable-extensions",
  //     "--disable-infobars",
  //     "--disable-notifications",
  //     "--no-first-run",
  //     "--disable-background-networking",
  //     "--disable-background-timer-throttling",
  //   ],
  //   headless: true,
  //   executablePath,
  // });

  const executablePath = await chromium.executablePath();

  const browser = await puppeteer.launch({
    args: [
      ...chromium.args,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--hide-scrollbars",
      "--disable-web-security",
      "--disable-extensions",
      "--disable-infobars",
      "--disable-notifications",
      "--no-first-run",
      "--disable-background-networking",
      "--disable-background-timer-throttling",
    ],
    headless: true,
    executablePath,
  });

  return browser!;
}

/**
 * Aborts main-frame navigations that leave the allowed origin, at the request
 * layer, so the outbound request is never sent.
 *
 * @param {Page} page - The Puppeteer page instance to guard.
 * @param {Object} options - Guard options.
 * @param {string} options.allowedOrigin - The only origin the main frame may navigate to.
 * @param {boolean} options.passThroughUnhandled - Whether this guard is the terminal
 * resolver for intercepted requests.
 *
 * @description
 * - Attach this BEFORE any other "request" listener: with no handler passing a
 *   priority, Puppeteer resolves an intercepted request the moment any one of them
 *   acts, and this guard skips anything already handled. Reversing the order
 *   disarms it with no visible symptom.
 * - Only main-frame navigations are checked, so off-origin subresources and iframes
 *   keep behaving as they do today. Popups are a separate target a page-scoped
 *   listener cannot see either.
 * - A request URL that cannot be parsed is treated as off-origin.
 * - Interception must be on for the guard to see requests, and an intercepted
 *   request hangs until exactly one handler resolves it. Pass
 *   `passThroughUnhandled: true` when no other handler (e.g.
 *   `attachResourceInterception`) will be attached to the page.
 *
 * @example
 * await attachNavigationOriginGuard(page, {
 *   allowedOrigin: "https://example.com",
 *   passThroughUnhandled: true,
 * });
 * await page.goto("https://example.com/resume");
 */
export const attachNavigationOriginGuard = async (
  page: Page,
  {
    allowedOrigin,
    passThroughUnhandled,
  }: { allowedOrigin: string; passThroughUnhandled: boolean }
) => {
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.isInterceptResolutionHandled()) {
      return;
    }

    const isMainFrameNavigation =
      request.isNavigationRequest() && request.frame() === page.mainFrame();

    if (isMainFrameNavigation) {
      const requestOrigin = (() => {
        try {
          return new URL(request.url()).origin;
        } catch {
          return null;
        }
      })();

      if (requestOrigin !== allowedOrigin) {
        request.abort().catch(() => {});
        return;
      }
    }

    if (passThroughUnhandled) {
      request.continue().catch(() => {});
    }
  });
};

/**
 * Attaches resource interception to a Puppeteer page instance.
 * This function intercepts requests for specific static resources (e.g., fonts, images, and Next.js static files)
 * and serves them from the local file system or a proxy server.
 *
 * @param {Page} page - The Puppeteer page instance to attach the resource interception to.
 *
 * @description
 * - The function intercepts requests matching specific resource folders (e.g., `/fonts`, `/images`, `/_next/static`).
 * - Requests to `/public` or `.next/static` are served directly from the local file system.
 * - Requests to Next.js image optimization endpoints (`/_next/image`) are proxied to an internal service.
 * - Non-matching requests are passed through without interception.
 *
 * @throws {Error} - If any unexpected error occurs during the interception process, the request is passed through.
 *
 * @example
 * const browser = await puppeteer.launch();
 * const page = await browser.newPage();
 * await attachResourceInterception(page);
 * await page.goto('http://localhost:3000');
 */
export const attachResourceInterception = async (page: Page) => {
  await page.setRequestInterception(true);
  page.on("request", async (request) => {
    if (request.isInterceptResolutionHandled()) {
      return;
    }

    const passThrough = () => {
      // console.log(`Request passed through: ${request.url()}`);
      request.continue();
    };

    try {
      const requestUrl = new URL(request.url());
      const requestPath = decodeURIComponent(requestUrl.pathname);
      const requestOrigin = requestUrl.origin;

      const resourceFolders = [
        "/fonts",
        "/images",
        "/icons",
        "/_next/static",
        "/_next/image",
      ];

      const shouldIntercept =
        requestOrigin === process.env.NEXT_PUBLIC_BASE_URL &&
        resourceFolders.some((prefix) => requestPath.startsWith(prefix));

      if (!shouldIntercept) {
        passThrough();
        return;
      }

      const staticDir = "/public";
      const nextStaticDir = ".next/static";

      const filePath = (() => {
        switch (true) {
          case requestPath.startsWith("/_next/static"): {
            return path.join(
              nextStaticDir,
              requestPath.replace("/_next/static/", "")
            );
          }
          case requestPath.startsWith("/_next/image"): {
            const url = requestUrl.searchParams.get("url")!;
            return path.join(staticDir, url);
          }

          default: {
            return path.join(staticDir, requestPath);
          }
        }
      })();

      if (!filePath) {
        passThrough();
        return;
      }

      // console.log(`Attempting to serve file from: ${filePath}`);

      if (requestPath.startsWith("/_next/image")) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/_next/image${requestUrl.search}`,
            {
              headers: request.headers(),
            }
          );
          const body = new Uint8Array(await response.arrayBuffer());
          const contentType =
            response.headers.get("Content-Type") || "image/webp";
          request.respond({
            body,
            contentType,
            headers: {
              ...request.headers(),
              "Cache-Control": "max-age=600, stale-while-revalidate=300",
            },
            status: 200,
          });
          // console.log(`Intercepted request for ${filePath}: Success`);
          return;
        } catch (_error) {
          passThrough();
          return;
        }
      }

      const fileContent: Uint8Array | undefined = await (async () => {
        try {
          const absolutePath = path.join(process.cwd(), filePath);
          const buffer = await fsPromise.readFile(absolutePath);
          // console.log(`Intercepted request for ${filePath}: Success`);

          return new Uint8Array(buffer);
        } catch {
          console.error(`Failed to read file at ${filePath}`);
          passThrough();
        }
      })();

      if (fileContent) {
        request.respond({
          body: fileContent,
          contentType: lookup(filePath) || "application/octet-stream",
          headers: {
            ...request.headers(),
            "Cache-Control": "max-age=600, stale-while-revalidate=300",
          },
          status: 200,
        });
      }
    } catch (error) {
      console.error(error);
      passThrough();
    }
  });
};
