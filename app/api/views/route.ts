import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();
export const config = {
  runtime: "edge",
};

async function getIpAdress(): Promise<string> {
  const resolvedHeaders = Object.fromEntries(await headers());
  const FALLBACK_IP_ADDRESS = "0.0.0.0";

  const forwardedFor = resolvedHeaders["x-forwarded-for"];

  if (forwardedFor) {
    return forwardedFor.split(",")[0] ?? FALLBACK_IP_ADDRESS;
  }

  return resolvedHeaders["x-real-ip"] ?? FALLBACK_IP_ADDRESS;
}

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

  const ip = await getIpAdress();

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
  const pathname = request?.nextUrl?.searchParams.get("pathname");

  if (!pathname) {
    return new NextResponse("Pathname not found", { status: 400 });
  }

  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({ total: 1_234, unique: 1_234 });
  }

  const unique =
    (await redis.get<number>(["pageviews", pathname, "unique"].join(":"))) ?? 0;
  const total =
    (await redis.get<number>(["pageviews", pathname, "total"].join(":"))) ?? 0;

  return NextResponse.json({ total, unique });
}
