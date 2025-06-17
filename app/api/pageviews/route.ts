import { getIpAddress } from "@/utils/server";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();
export const config = {
  runtime: "edge",
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get("Content-Type") !== "application/json") {
    return new NextResponse("must be json", { status: 400 });
  }

  const body = await request.json();
  let pathname: string | undefined = undefined;
  if ("pathname" in body) {
    pathname = body.pathname;
  }
  if (!pathname) {
    return new NextResponse("Pathname not found", { status: 400 });
  }

  if (process.env.NODE_ENV !== "production") {
    return new NextResponse(null, { status: 202 });
  }

  const ip = await getIpAddress();

  // Always increment total
  await redis.incr(["pageviews", pathname, "total"].join(":"));

  if (ip) {
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
        ex: 24 * 60 * 60,
        nx: true,
      }
    );
    if (!isNew) {
      return new NextResponse(null, { status: 202 });
    }
  }

  await redis.incr(["pageviews", pathname, "unique"].join(":"));
  return new NextResponse(null, { status: 202 });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl;
  // Support for multiple pathnames: ?pathname=/a&pathname=/b
  const pathnames = url.searchParams.getAll("pathname");

  if (!pathnames.length) {
    return new NextResponse("Pathname not found", { status: 400 });
  }

  if (process.env.NODE_ENV !== "production") {
    // Mocked dev response
    return NextResponse.json(
      Object.fromEntries(
        pathnames.map((pathname) => [pathname, { total: 1_234, unique: 1_234 }])
      )
    );
  }

  // Prepare all redis keys in order: [unique, total, unique, total, ...]
  const keys: string[] = [];
  for (const pathname of pathnames) {
    keys.push(
      ["pageviews", pathname, "unique"].join(":"),
      ["pageviews", pathname, "total"].join(":")
    );
  }

  // Batch get all values
  const results = await redis.mget<number[]>(...keys);

  // Build response object
  const data: Record<string, { unique: number; total: number }> = {};
  for (let i = 0; i < pathnames.length; i++) {
    // mget returns results in same order as keys
    data[pathnames[i]] = {
      total: results[i * 2 + 1] ?? 0,
      unique: results[i * 2] ?? 0,
    };
  }

  return NextResponse.json(data);
}
