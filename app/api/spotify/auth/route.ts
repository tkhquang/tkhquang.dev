import { REDIRECT_URI, SCOPES } from "@/services/spotify/token";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");

  // 404 rather than 401: the route does not need to admit that it exists.
  if (!process.env.SPOTIFY_AUTH_KEY || key !== process.env.SPOTIFY_AUTH_KEY) {
    return new NextResponse("Not found", { status: 404 });
  }

  const state = crypto.randomUUID();
  // Single use, ten minutes: enough to click through a consent screen.
  await Redis.fromEnv().set(`spotify:state:${state}`, true, { ex: 600 });

  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.set("client_id", process.env.SPOTIFY_CLIENT_ID ?? "");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", SCOPES.join(" "));
  url.searchParams.set("state", state);
  // Always show the consent screen: it restarts the six-month clock, and it
  // is the only place the granted scopes are visible.
  url.searchParams.set("show_dialog", "true");

  return NextResponse.redirect(url);
}
