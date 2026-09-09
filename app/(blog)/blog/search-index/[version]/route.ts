import { buildLedgerIndex } from "@/lib/ledger-search/build-index";
import { getMarkdownParser } from "@/lib/MarkdownParser";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ version: `${process.env.NEXT_PUBLIC_LEDGER_SEARCH_VERSION}.bin` }];
}

/* The static route regenerates the index from published posts on each build. */
export async function GET() {
  const markdownParser = await getMarkdownParser();
  const posts = await markdownParser.getAllPosts();
  const index = await buildLedgerIndex(posts);

  /* Next excludes octet-stream from automatic compression. Compress once at
     build time. Browser Fetch decodes gzip before the engine reads the bytes. */
  const compressed = gzipSync(index, { level: 9 });

  return new Response(compressed, {
    headers: {
      "Cache-Control":
        process.env.NODE_ENV === "production"
          ? "public, max-age=31536000, immutable"
          : "no-store",
      "Content-Encoding": "gzip",
      "Content-Length": String(compressed.byteLength),
      "Content-Type": "application/octet-stream",
      ETag: `"${createHash("sha256").update(compressed).digest("base64url")}"`,
    },
  });
}
