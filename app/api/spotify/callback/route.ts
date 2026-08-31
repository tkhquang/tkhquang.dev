import {
  exchangeAuthorizationCode,
  SPOTIFY_USER_ID,
  storeToken,
} from "@/services/spotify/token";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return new NextResponse("Missing code or state", { status: 400 });
  }

  // Single use, and it proves the round trip started at the guarded route.
  const known = await Redis.fromEnv().getdel(`spotify:state:${state}`);

  if (!known) {
    return new NextResponse("Unknown state", { status: 400 });
  }

  let token: Awaited<ReturnType<typeof exchangeAuthorizationCode>>;
  try {
    token = await exchangeAuthorizationCode(code);
  } catch (error) {
    console.error("Spotify code exchange: ", error);
    return new NextResponse("Code exchange failed", { status: 400 });
  }

  // `state` proves where the flow started, not whose account got approved.
  // Without this check, anyone who reaches the consent screen can repoint
  // the site at their own listening history.
  const profileResponse = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });

  // A Spotify hiccup must not report as "Wrong account" - that message
  // drives a human action.
  if (!profileResponse.ok) {
    return new NextResponse("Profile check failed", { status: 502 });
  }

  const profile = await profileResponse.json();

  if (profile.id !== SPOTIFY_USER_ID) {
    return new NextResponse("Wrong account", { status: 403 });
  }

  await storeToken(token.refresh_token);

  return new NextResponse("Reauthorized. Good for another six months.");
}
