import { isAllowedPathname } from "@/utils/pageviews";
import { getIpAddress } from "@/utils/server";
import { Redis } from "@upstash/redis";
import { escape } from "es-toolkit";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();

/**
 * The 79.2px plate only fits about 13 characters, so this bounds how far a
 * long label can spill rather than preventing overflow.
 */
const MAX_LABEL_LENGTH = 32;

/**
 * Codepoints XML 1.0 forbids outright. `escape` only covers `& < > " '`, so
 * without this a control character in the label reaches the wire and the
 * browser refuses to parse the response as SVG.
 */
const NON_XML_CHARACTERS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;

// Updated SVG_TEMPLATE to use placeholders for dynamic values
const SVG_TEMPLATE = `
<svg xmlns="http://www.w3.org/2000/svg" width="120.7" height="20">
    <linearGradient id="b" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <mask id="a">
        <rect width="120.7" height="20" rx="3" fill="#fff"/>
    </mask>
    <g mask="url(#a)">
        <rect width="79.2" height="20" fill="#555"/>
        <rect x="79.2" width="41.5" height="20" fill="#007ec6"/>
        <rect width="120.7" height="20" fill="url(#b)"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
        <text x="40.6" y="15" fill="#010101" fill-opacity=".3">{LABEL}</text>
        <text x="40.6" y="14">{LABEL}</text>
        <text x="99" y="15" fill="#010101" fill-opacity=".3">{COUNT}</text>
        <text x="99" y="14">{COUNT}</text>
    </g>
</svg>
`;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl;
  const pathname = url.searchParams.get("pathname");
  const type = url.searchParams.get("type") || "total"; // Default to 'total'
  const label = url.searchParams.get("label") || "Profile views"; // Default label

  if (!pathname) {
    return new NextResponse("Pathname not found", { status: 400 });
  }

  if (!isAllowedPathname(pathname)) {
    return new NextResponse("Invalid pathname", { status: 400 });
  }

  if (type !== "unique" && type !== "total") {
    return new NextResponse(
      "Invalid type parameter. Must be 'unique' or 'total'.",
      { status: 400 }
    );
  }

  // Update page views before fetching
  if (process.env.NODE_ENV === "production") {
    const ip = await getIpAddress();

    // Always increment total
    await redis.incr(["pageviews", pathname, "total"].join(":"));

    if (ip && ip !== "0.0.0.0") {
      // Hash the IP in order to not store it directly in db
      const buf = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(ip)
      );
      const hash = Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Deduplicate the IP for each pathname in 24 hours
      const isNew = await redis.set(
        ["deduplicate", hash, pathname].join(":"),
        true,
        {
          ex: 24 * 60 * 60, // 24 hours
          nx: true, // Only set if not exists
        }
      );
      if (isNew) {
        await redis.incr(["pageviews", pathname, "unique"].join(":"));
      }
    }
  }

  let count: number | string = 0;

  if (process.env.NODE_ENV !== "production") {
    // Mocked dev response
    count =
      type === "unique"
        ? Math.floor(Math.random() * 500) + 100
        : Math.floor(Math.random() * 5000) + 1000;
  } else {
    const redisKey = ["pageviews", pathname, type].join(":");
    const result = await redis.get<number>(redisKey);
    count = result ?? 0;
  }

  // Format count with commas for better readability if it's a number
  const formattedCount =
    typeof count === "number"
      ? new Intl.NumberFormat("en").format(count)
      : count;

  // Truncate before escaping so the cut cannot land inside an entity.
  const escapedLabel = escape(
    label.replace(NON_XML_CHARACTERS, "").slice(0, MAX_LABEL_LENGTH)
  );
  const escapedCount = escape(formattedCount.toString());

  // One pass with a replacer function: chained replaces let a "{COUNT}" label
  // be substituted again, and a string replacement would interpret $-patterns
  // a caller can put in the query string.
  const svg = SVG_TEMPLATE.replace(/{LABEL}|{COUNT}/g, (placeholder) =>
    placeholder === "{LABEL}" ? escapedLabel : escapedCount
  );

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, private",
      Expires: "Sat, 01 Jan 2000 00:00:00 GMT",
      Pragma: "no-cache",
    },
    status: 200,
  });
}
