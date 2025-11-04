import { getIpAddress } from "@/utils/server";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();
export const runtime = "edge";

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
<script xmlns=""/></svg>
`;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl;
  const pathname = url.searchParams.get("pathname");
  const type = url.searchParams.get("type") || "total"; // Default to 'total'
  const label = url.searchParams.get("label") || "Profile views"; // Default label

  if (!pathname) {
    return new NextResponse("Pathname not found", { status: 400 });
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

  const svg = SVG_TEMPLATE.replace(/{LABEL}/g, label).replace(
    /{COUNT}/g,
    formattedCount.toString()
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
