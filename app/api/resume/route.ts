import {
  attachResourceInterception,
  createBrowserInstance,
} from "@/utils/browser";
import fsPromise from "fs/promises";
import { compressPDF } from "ghostscript-node";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { type Browser } from "puppeteer-core";
import { v4 as uuidv4 } from "uuid";

let browser: Browser | null;

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

const generateResponse = (pdfBuffer: Buffer): NextResponse => {
  const browserPid = String(browser!.process()!.pid!);

  // Convert Buffer to Uint8Array
  const uint8Array = new Uint8Array(pdfBuffer);

  const response = new NextResponse(uint8Array);
  response.headers.set("Content-Type", "application/pdf");
  response.headers.set(
    "Content-Disposition",
    "attachment; filename=document.pdf"
  );
  response.headers.set("api-browser-pid", browserPid);
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
  "warm-up"?: BooleanQueryString;
}

// For Vercel deployment
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const {
    compress = "false",
    intercept = "false",
    url = `${process.env.NEXT_PUBLIC_BASE_URL}/resume`,
  } = Object.fromEntries(
    request.nextUrl.searchParams.entries()
  ) as GetQueryParams;
  const params = request.nextUrl.searchParams.toString();
  console.time(`GET ${params}`);

  try {
    if (!url?.startsWith(process.env.NEXT_PUBLIC_BASE_URL!)) {
      throw new Error("URL not allowed");
    }

    const pdfBuffer = await generatePDF({
      compress,
      intercept,
      url,
    });

    return generateResponse(pdfBuffer);
  } catch (error) {
    console.error("Error processing PDF generation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  } finally {
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
