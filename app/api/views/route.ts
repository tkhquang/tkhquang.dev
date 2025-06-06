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

  console.log(resolvedHeaders);

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
  const ip = await getIpAdress();

  if (ip) {
    // Hash the IP in order to not store it directly in db
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(ip)
    );
    const hash = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Deduplicate the IP for each pathname
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

  await redis.incr(["pageviews", pathname].join(":"));
  return new NextResponse(null, { status: 202 });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const pathname = request?.nextUrl?.searchParams.get("pathname");
  const views =
    (await redis.get<number>(["pageviews", pathname].join(":"))) ?? 0;

  return NextResponse.json({ views });
}
