import { headers } from "next/headers";

export async function getIpAddress(): Promise<string> {
  const resolvedHeaders = Object.fromEntries(await headers());
  const FALLBACK_IP_ADDRESS = "0.0.0.0";

  const forwardedFor = resolvedHeaders["x-forwarded-for"];

  if (forwardedFor) {
    // Can be a comma-separated list of IPs, the first one is the client
    const ips = forwardedFor.split(",");
    return ips[0]?.trim() ?? FALLBACK_IP_ADDRESS;
  }

  return resolvedHeaders["x-real-ip"] ?? FALLBACK_IP_ADDRESS;
}
