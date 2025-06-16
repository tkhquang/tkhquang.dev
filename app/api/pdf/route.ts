import {
  attachResourceInterception,
  createBrowserInstance,
} from "@/utils/browser";
import crypto from "crypto";
import fsPromise from "fs/promises";
import { compressPDF } from "ghostscript-node";
import { type NextRequest, NextResponse } from "next/server";
import path from "path";
import type { Browser } from "puppeteer-core";
import { v4 as uuidv4 } from "uuid";

let browser: Browser | null;

// Cache configuration
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
const CACHE_DIR = path.resolve("/tmp/pdf-cache");

// Launch or reuse the browser instance
async function getBrowserInstance(): Promise<Browser> {
  if (!browser) {
    console.info("Launching a new browser instance...");
    browser = await createBrowserInstance();
    return browser!;
  }

  console.info("Reusing existing browser instance...");
  return browser!;
}

// Generate cache key based on URL and parameters
function generateCacheKey(
  url: string,
  compress: string,
  intercept: string
): string {
  const data = `${url}-${compress}-${intercept}`;
  return crypto.createHash("md5").update(data).digest("hex");
}

// Check if cached PDF exists and is still valid
async function getCachedPDF(cacheKey: string): Promise<Buffer | null> {
  try {
    await fsPromise.mkdir(CACHE_DIR, { recursive: true });

    const cacheFilePath = path.join(CACHE_DIR, `${cacheKey}.pdf`);
    const metaFilePath = path.join(CACHE_DIR, `${cacheKey}.meta.json`);

    // Check if both files exist
    const [pdfExists, metaExists] = await Promise.all([
      fsPromise
        .access(cacheFilePath)
        .then(() => true)
        .catch(() => false),
      fsPromise
        .access(metaFilePath)
        .then(() => true)
        .catch(() => false),
    ]);

    if (!pdfExists || !metaExists) {
      return null;
    }

    // Read metadata to check timestamp
    const metaData = JSON.parse(
      await fsPromise.readFile(metaFilePath, "utf-8")
    );
    const now = Date.now();
    const cacheAge = now - metaData.timestamp;

    // If cache is older than 1 week, return null
    if (cacheAge > CACHE_DURATION) {
      console.info(`Cache expired for key: ${cacheKey}`);
      // Clean up expired cache files
      await Promise.all([
        fsPromise.unlink(cacheFilePath).catch(() => {}),
        fsPromise.unlink(metaFilePath).catch(() => {}),
      ]);
      return null;
    }

    console.info(`Using cached PDF for key: ${cacheKey}`);
    return await fsPromise.readFile(cacheFilePath);
  } catch (error) {
    console.error("Error reading cached PDF:", error);
    return null;
  }
}

// Save PDF to cache
async function savePDFToCache(
  cacheKey: string,
  pdfBuffer: Buffer,
  url: string
): Promise<void> {
  try {
    await fsPromise.mkdir(CACHE_DIR, { recursive: true });

    const cacheFilePath = path.join(CACHE_DIR, `${cacheKey}.pdf`);
    const metaFilePath = path.join(CACHE_DIR, `${cacheKey}.meta.json`);

    const metadata = {
      timestamp: Date.now(),
      url,
      size: pdfBuffer.length,
      cacheKey,
    };

    await Promise.all([
      fsPromise.writeFile(cacheFilePath, pdfBuffer),
      fsPromise.writeFile(metaFilePath, JSON.stringify(metadata, null, 2)),
    ]);

    console.info(`PDF cached with key: ${cacheKey}`);
  } catch (error) {
    console.error("Error saving PDF to cache:", error);
    // Don't throw error - caching failure shouldn't break the API
  }
}

// Clean up old cache files (optional cleanup function)
async function cleanupExpiredCache(): Promise<void> {
  try {
    const files = await fsPromise.readdir(CACHE_DIR);
    const metaFiles = files.filter((file) => file.endsWith(".meta.json"));

    for (const metaFile of metaFiles) {
      const metaFilePath = path.join(CACHE_DIR, metaFile);
      const pdfFile = metaFile.replace(".meta.json", ".pdf");
      const pdfFilePath = path.join(CACHE_DIR, pdfFile);

      try {
        const metaData = JSON.parse(
          await fsPromise.readFile(metaFilePath, "utf-8")
        );
        const now = Date.now();
        const cacheAge = now - metaData.timestamp;

        if (cacheAge > CACHE_DURATION) {
          await Promise.all([
            fsPromise.unlink(pdfFilePath).catch(() => {}),
            fsPromise.unlink(metaFilePath).catch(() => {}),
          ]);
          console.info(`Cleaned up expired cache: ${metaData.cacheKey}`);
        }
      } catch (error) {
        // If we can't read metadata, remove both files
        await Promise.all([
          fsPromise.unlink(pdfFilePath).catch(() => {}),
          fsPromise.unlink(metaFilePath).catch(() => {}),
        ]);
      }
    }
  } catch (error) {
    console.error("Error during cache cleanup:", error);
  }
}

interface RenderPagesToMergedPDFOptions
  extends Pick<BaseQueryParams, "compress" | "intercept"> {
  url: string;
}

async function generatePDF({
  compress,
  intercept,
  url,
}: RenderPagesToMergedPDFOptions): Promise<Buffer> {
  const key = uuidv4();
  const baseOutputDir = path.resolve("/tmp");
  const dirPath = path.join(baseOutputDir, key);
  const normalizedDirPath = path.normalize(dirPath);

  if (!normalizedDirPath.startsWith(baseOutputDir)) {
    throw new Error("Invalid directory path specified!");
  }

  await fsPromise.mkdir(normalizedDirPath, { recursive: true });

  let pdfBuffer!: Buffer;

  try {
    const browser = await getBrowserInstance();
    const page = await browser.newPage();

    try {
      await page.emulateMediaType("print");
      await page.setViewport({
        deviceScaleFactor: 1,
        height: 1123,
        isMobile: false,
        width: 794,
      });

      if (intercept === "true") {
        await attachResourceInterception(page);
      }

      await page.goto(url, {
        timeout: 10_000,
        waitUntil: "networkidle0",
      });

      pdfBuffer = Buffer.from(
        await page.pdf({
          format: "A4",
          margin: {
            bottom: "0",
            left: "0",
            right: "0",
            top: "0",
          },
          printBackground: true,
        })
      );
    } catch (error) {
      console.error(`Error rendering page at ${url} to PDF:`, error);
      throw error;
    } finally {
      await page.close();
      // Clean up temporary directory
      await fsPromise.rm(dirPath, { force: true, recursive: true });
    }

    if (compress === "true") {
      try {
        pdfBuffer = await compressPDF(pdfBuffer, "utf-8");
      } catch (error) {
        console.error(`Error compressing pdf at ${url} to PDF:`, error);
      }
    }

    return pdfBuffer;
  } catch (error) {
    console.error("Error rendering or merging PDFs:", error);
    throw error;
  }
}

const generateResponse = (
  pdfBuffer: Buffer,
  fromCache = false
): NextResponse => {
  const browserPid = browser
    ? String(browser.process()?.pid || "unknown")
    : "unknown";

  // Convert Buffer to Uint8Array
  const uint8Array = new Uint8Array(pdfBuffer);

  const response = new NextResponse(uint8Array);
  response.headers.set("Content-Type", "application/pdf");
  response.headers.set(
    "Content-Disposition",
    "attachment; filename=document.pdf"
  );
  response.headers.set("x-browser-pid", browserPid);
  response.headers.set("x-pdf-cached", fromCache ? "true" : "false");
  return response;
};

type BooleanQueryString = "true" | "false";

interface BaseQueryParams {
  intercept?: BooleanQueryString;
  compress?: BooleanQueryString;
}

interface GetQueryParams extends BaseQueryParams {
  key?: string;
  url?: string;
  "skip-cache"?: BooleanQueryString;
}

// For Vercel deployment
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const {
    compress = "false",
    intercept = "false",
    url = `${process.env.NEXT_PUBLIC_BASE_URL}/resume`,
    "skip-cache": skipCache = "false",
  } = Object.fromEntries(
    request.nextUrl.searchParams.entries()
  ) as GetQueryParams;

  const params = request.nextUrl.searchParams.toString();
  console.time(`GET ${params}`);

  try {
    if (!url?.startsWith(process.env.NEXT_PUBLIC_BASE_URL!)) {
      throw new Error("URL not allowed");
    }

    // Generate cache key
    const cacheKey = generateCacheKey(url, compress, intercept);

    // Check cache first (unless skip-cache is true)
    if (skipCache !== "true") {
      const cachedPDF = await getCachedPDF(cacheKey);
      if (cachedPDF) {
        console.info(`Serving cached PDF for URL: ${url}`);
        return generateResponse(cachedPDF, true);
      }
    }

    // Generate new PDF
    console.info(`Generating new PDF for URL: ${url}`);
    const pdfBuffer = await generatePDF({
      compress,
      intercept,
      url,
    });

    // Save to cache (fire and forget)
    savePDFToCache(cacheKey, pdfBuffer, url).catch((error) => {
      console.error("Failed to cache PDF:", error);
    });

    return generateResponse(pdfBuffer, false);
  } catch (error) {
    console.error("Error processing PDF generation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  } finally {
    // Cleanup expired cache files (fire and forget)
    cleanupExpiredCache().catch((error) => {
      console.error("Failed to cleanup cache:", error);
    });
    console.timeEnd(`GET ${params}`);
  }
}

// Clean up browser on process exit
const cleanupBrowser = async () => {
  if (browser) {
    await browser.close();
    browser = null;
    console.info("Browser instance closed");
  }
};

process.on("SIGINT", cleanupBrowser);
process.on("exit", cleanupBrowser);
