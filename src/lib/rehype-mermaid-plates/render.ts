import fsPromise from "fs/promises";
import { Element, Root } from "hast";
import { fromHtml } from "hast-util-from-html";
import path from "path";
import type { Browser } from "puppeteer-core";
import { Transformer } from "unified";
import { visit } from "unist-util-visit";

/*
 * The press: renders the corpus's mermaid sources into finished svgs
 * through headless chromium.
 *
 * The stack is the resume PDF route's, deliberately: puppeteer-core with
 * @sparticuz/chromium on Vercel and the local puppeteer chrome
 * elsewhere, a pairing whose versions ship matched. A browser client
 * paired against a chromium it did not ship with is what Vercel's build
 * image cannot serve, either through a missing system library or through
 * a CDP protocol skew, and neither failure surfaces until the build runs
 * there.
 *
 * Rendering happens only at press time: the posts route is force-static
 * with dynamicParams false, so no deployed function ever runs this. If
 * posts ever move to ISR, the [slug] route must trace
 * node_modules/@sparticuz/chromium, puppeteer-core, the mermaid bundle,
 * and the measurement font, which means dropping the turbopackIgnore
 * markers on the dynamic imports below.
 */

export interface MermaidRenderOptions {
  mermaidConfig: Record<string, unknown>;
}

/* A production build constructs a fresh MarkdownParser per page (the
   global parser cache is development-only), so anything meant to be
   paid once per build worker must live here at module scope: the
   browser, and the multi-megabyte bundle and font reads. */
let browserPromise: Promise<Browser> | null = null;
let inFlight = 0;
let idleTimer: NodeJS.Timeout | undefined;
let assetsPromise: Promise<RenderAssets> | null = null;

interface RenderAssets {
  shellHtml: string;
  mermaidBundle: string;
}

/* The joins carry their full path from process.cwd() so the bundler's
   file tracer has no literal segment to scope on; the comment opts the
   call out of analysis, the same pattern as src/utils/browser.ts. The
   files resolve at the root because .npmrc sets node-linker=hoisted. */
const rootFile = (...segments: string[]) =>
  path.join(/*turbopackIgnore: true*/ process.cwd(), ...segments);

/* Labels are measured in the render page with the face the article
   displays: the @fontsource woff2 rides in as a data uri, because the
   Vercel-side chromium ships Open Sans and nothing else, and a mono
   request falling back to a proportional face would skew every width
   estimate the diagram layout is tuned against. Source Code Pro
   advances 0.6em per glyph at every weight, the same as the Courier
   New fallback that serves local machines. */
async function loadAssets(): Promise<RenderAssets> {
  const [mermaidBundle, fontData] = await Promise.all([
    fsPromise.readFile(
      rootFile("node_modules", "mermaid", "dist", "mermaid.min.js"),
      "utf8"
    ),
    fsPromise.readFile(
      rootFile(
        "node_modules",
        "@fontsource",
        "source-code-pro",
        "files",
        "source-code-pro-latin-400-normal.woff2"
      )
    ),
  ]);
  const shellHtml = [
    "<!doctype html>",
    '<html lang="en"><head><meta charset="utf-8"/><style>',
    "@font-face {",
    '  font-family: "Source Code Pro";',
    "  font-style: normal;",
    "  font-weight: 400;",
    `  src: url(data:font/woff2;base64,${fontData.toString(
      "base64"
    )}) format("woff2");`,
    "}",
    "</style></head><body></body></html>",
  ].join("\n");
  return { shellHtml, mermaidBundle };
}

async function launchBrowser(): Promise<Browser> {
  /* The imports are dynamic and branch-gated: sparticuz extracts a
     linux binary and dies on win32, and the full puppeteer package has
     no business loading on Vercel. Both are on Next's default
     server-external list, so the requires stay real at runtime.
     turbopackIgnore keeps the file tracer out of them: it follows every
     specifier regardless of the branch, and without the marker each of
     the eleven routes that reach a MarkdownParser drags a copy of
     puppeteer and a link to the 65MB chromium package into its function
     bundle for a renderer only press time ever calls. */
  if (process.env.VERCEL) {
    const { default: chromium } = await import(
      /* turbopackIgnore: true */ "@sparticuz/chromium"
    );
    const { default: puppeteer } = await import(
      /* turbopackIgnore: true */ "puppeteer-core"
    );
    const executablePath = await chromium.executablePath();
    /* ETXTBSY guard: a second build worker spawning /tmp/chromium while
       the first extraction still holds it open. Within one process the
       memoized browserPromise already serializes the launch; the retry
       covers a concurrent worker. */
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await puppeteer.launch({
          args: [
            ...chromium.args,
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--hide-scrollbars",
            "--no-first-run",
          ],
          executablePath,
          headless: true,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (attempt >= 2 || !message.includes("ETXTBSY")) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }
  const { default: puppeteer } = await import(
    /* turbopackIgnore: true */ "puppeteer"
  );
  return (await puppeteer.launch({ headless: true })) as unknown as Browser;
}

/* ||= keeps a rejected promise, which would make one transient failure
   poison every later page in the process: the dev server survives a page
   error, so each retry would re-await the same settled rejection and
   report a stale cause. Clearing the memo on failure lets the next caller
   try again. */
const clearOnReject = <T>(
  run: () => Promise<T>,
  clear: () => void
): Promise<T> =>
  run().catch((error) => {
    clear();
    throw error;
  });

function acquireAssets(): Promise<RenderAssets> {
  assetsPromise ||= clearOnReject(loadAssets, () => {
    assetsPromise = null;
  });
  return assetsPromise;
}

/* The count rises only once a browser actually exists, so the release in
   the caller's finally is always balanced: a launch that rejects has
   nothing to hand back, and leaving the count at zero across the launch
   window is safe because releaseBrowser is the only thing that arms an
   idle timer, and this function clears any pending one on the way in. */
async function acquireBrowser(): Promise<Browser> {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = undefined;
  }
  browserPromise ||= clearOnReject(launchBrowser, () => {
    browserPromise = null;
  });
  const browser = await browserPromise;
  inFlight += 1;
  return browser;
}

/* An open CDP connection keeps the event loop alive, which can hang a
   build worker at exit and leaks chromium processes from the dev
   server, so the browser closes after a short idle window. The timer
   is unref'd: if the build's last page finishes inside the window the
   process exits anyway and puppeteer's own exit hooks reap the child. */
function releaseBrowser() {
  inFlight -= 1;
  if (inFlight > 0) {
    return;
  }
  idleTimer = setTimeout(() => {
    const closing = browserPromise;
    browserPromise = null;
    void closing?.then((browser) => browser.close()).catch(() => {});
  }, 5_000);
  idleTimer.unref();
}

type PageRenderResult = { svg: string } | { error: string };

/* Serialized into the render page, so it must stay self-contained.
   The order is load-bearing: fonts first, because mermaid measures
   through getBBox and memoizes per font key with no invalidation, so a
   face that loads late poisons every later measurement; then one
   initialize; then each diagram under its ordinal id. mermaid.render
   stamps that id on the svg root, which is how the restore pass finds
   each drawing again. The DOMParser round trip normalizes the markup
   into the serialization the rest of the pipeline parses. */
const renderInPage = async ({
  sources,
  config,
}: {
  sources: string[];
  config: Record<string, unknown>;
}): Promise<PageRenderResult[]> => {
  const mermaid = (
    window as unknown as {
      mermaid: {
        initialize(config: Record<string, unknown>): void;
        render(id: string, source: string): Promise<{ svg: string }>;
      };
    }
  ).mermaid;
  await Promise.all(Array.from(document.fonts, (font) => font.load()));
  await document.fonts.ready;
  mermaid.initialize({
    startOnLoad: false,
    suppressErrorRendering: true,
    ...config,
  });
  const results: PageRenderResult[] = [];
  for (const [index, source] of sources.entries()) {
    try {
      const { svg } = await mermaid.render(`mermaid-${index}`, source);
      const parsed = new DOMParser().parseFromString(svg, "text/html");
      const element = parsed.getElementsByTagName("svg")[0];
      results.push({
        svg: new XMLSerializer().serializeToString(element),
      });
    } catch (error) {
      results.push({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return results;
};

export const isMermaidPre = (node: Element) =>
  node.tagName === "pre" &&
  Array.isArray(node.properties?.className) &&
  (node.properties.className as string[]).includes("mermaid");

/* Every diagram is a pre.mermaid that the prepare pass has already
   reduced to a single text child of ready-to-parse source. Each pre is
   replaced in place by its svg. A diagram that fails to render fails
   the build rather than shipping a hole in the article. */
export function rehypeMermaidRender(
  options: MermaidRenderOptions
): Transformer<Root> {
  return async (tree) => {
    const targets: Array<{
      parent: Root | Element;
      index: number;
      source: string;
    }> = [];
    visit(tree, "element", (node: Element, index, parent) => {
      if (!isMermaidPre(node) || parent == null || typeof index !== "number") {
        return;
      }
      const child = node.children[0];
      targets.push({
        index,
        parent,
        source: child?.type === "text" ? child.value : "",
      });
    });
    if (targets.length === 0) {
      return;
    }

    /* Started before the launch is awaited so the reads still run against
       it, but only awaited inside the guarded region: an asset read that
       rejects must still release the browser it was racing. The no-op
       catch marks the shared promise handled across the launch window, or
       a read failing before the launch settles would surface as an
       unhandled rejection; the await below still rethrows it. */
    const pendingAssets = acquireAssets();
    void pendingAssets.catch(() => {});
    const browser = await acquireBrowser();
    try {
      const { mermaidBundle, shellHtml } = await pendingAssets;
      const page = await browser.newPage();
      try {
        await page.setContent(shellHtml);
        await page.addScriptTag({ content: mermaidBundle });
        const results = await page.evaluate(renderInPage, {
          config: options.mermaidConfig,
          sources: targets.map((target) => target.source),
        });
        results.forEach((result, ordinal) => {
          if ("error" in result) {
            throw new Error(
              `mermaid diagram ${ordinal} failed to render: ${result.error}\n` +
                targets[ordinal].source.slice(0, 200)
            );
          }
          const svg = fromHtml(result.svg, { fragment: true })
            .children[0] as Element;
          targets[ordinal].parent.children[targets[ordinal].index] = svg;
        });
      } finally {
        await page.close();
      }
    } finally {
      releaseBrowser();
    }
  };
}
