"use server";

import { getMimeTypeFromFilename } from "@shopify/mime-types";
import chromium from "@sparticuz/chromium";
import fsPromise from "fs/promises";
import path from "path";
import puppeteer, { type Browser, type Page } from "puppeteer-core";

const executablePath = await chromium.executablePath();

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
  const browser = await puppeteer.launch({
    args: [
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
          contentType: getMimeTypeFromFilename(filePath),
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
