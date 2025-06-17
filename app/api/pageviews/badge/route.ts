import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();
export const config = {
  runtime: "edge",
};

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

  let count: number | string = 0;

  if (process.env.NODE_ENV !== "production") {
    // Mocked dev response
    count = type === "unique" ? 1234 : 4567;
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
      "Cache-Control": "no-cache, no-store, must-revalidate", // Prevent caching
    },
    status: 200,
  });
}
