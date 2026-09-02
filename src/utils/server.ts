import { isIP } from "net";
import { headers } from "next/headers";

const FALLBACK_IP_ADDRESS = "0.0.0.0";

/**
 * Vercel overwrites `x-forwarded-for` with the real client IP and does not
 * forward external values, so it is not spoofable there. This still validates
 * it, because the result is hashed into a Redis key and any other host (a
 * local run, or an Enterprise trusted proxy) forwards whatever the client sent.
 */
function toIpAddress(value: string | undefined): string | null {
  // Can be a comma-separated list of IPs, the first one is the client
  const ip = value?.split(",")[0]?.trim();

  return ip && isIP(ip) ? ip : null;
}

export async function getIpAddress(): Promise<string> {
  const resolvedHeaders = Object.fromEntries(await headers());

  return (
    toIpAddress(resolvedHeaders["x-forwarded-for"]) ??
    toIpAddress(resolvedHeaders["x-real-ip"]) ??
    FALLBACK_IP_ADDRESS
  );
}
