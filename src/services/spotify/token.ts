import { SPOTIFY_PROFILE_URL } from "@/constants/spotify";
import { Redis } from "@upstash/redis";
import { addMonths, differenceInDays } from "date-fns";
import "server-only";

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const STORE_KEY = "spotify:refresh_token";

export const SCOPES = [
  "user-read-currently-playing",
  "user-read-recently-played",
  "user-top-read",
];

export const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/spotify/callback`;

// Derived from the public profile URL so there is no second copy of the
// account id to keep in sync.
export const SPOTIFY_USER_ID = new URL(SPOTIFY_PROFILE_URL).pathname
  .split("/")
  .pop();

const basicAuth = Buffer.from(
  `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
).toString("base64");

/** Terminal auth failure: only a human on the consent screen can fix it. */
export class SpotifyReauthRequired extends Error {}

type StoredToken = { authorized_at: number; token: string };

// Lazy so a build without Upstash credentials blanks the Spotify sections
// (their callers catch) instead of throwing at import time. `cache: "default"`
// overrides the SDK's explicit `no-store`, which would flip every route that
// renders through getAccessToken to dynamic - /music must stay ISR.
let redis: Redis | null = null;
const getRedis = () => (redis ??= Redis.fromEnv({ cache: "default" }));

/**
 * The env var seeds a fresh deployment. Once the callback has written to the
 * store, the store wins, so renewing never needs a redeploy.
 */
const readStoredToken = async (): Promise<StoredToken | null> => {
  const stored = await getRedis().get<StoredToken>(STORE_KEY);

  if (stored?.token) {
    return stored;
  }

  const seed = process.env.SPOTIFY_REFRESH_TOKEN;

  // `authorized_at: 0` marks an age we do not know - the expiry warning
  // skips those.
  return seed ? { authorized_at: 0, token: seed } : null;
};

export const storeToken = async (token: string) => {
  // Spotify never says when a refresh token dies. The authorization time is
  // only knowable if we write it down ourselves.
  await getRedis().set(STORE_KEY, { authorized_at: Date.now(), token });
};

/**
 * Spotify does not expose the expiry, so this is our own arithmetic against
 * our own timestamp: six months from authorization.
 */
const warnBeforeExpiry = ({ authorized_at }: StoredToken) => {
  if (!authorized_at) {
    return;
  }

  const daysLeft = differenceInDays(addMonths(authorized_at, 6), new Date());

  if (daysLeft < 0) {
    console.warn(
      "Spotify refresh token is past its ~6-month window - open /api/spotify/auth to renew"
    );
  } else if (daysLeft < 30) {
    console.warn(
      `Spotify refresh token expires in ~${daysLeft} days - open /api/spotify/auth to renew`
    );
  }
};

// In-memory cache (good enough for Vercel/Netlify functions, single
// serverless instance). Redis is only read when this expires, ~once an hour.
let cachedAccessToken: string | null = null;
let tokenExpiry = 0;

export const getAccessToken = async (): Promise<string> => {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiry) {
    return cachedAccessToken;
  }

  const stored = await readStoredToken();
  if (!stored) {
    throw new SpotifyReauthRequired("No refresh token stored");
  }

  warnBeforeExpiry(stored);

  const response = await fetch(TOKEN_ENDPOINT, {
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: stored.token,
    }),
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const json = await response.json();

  if (!response.ok) {
    // Terminal: retrying an `invalid_grant` is the one thing that cannot help.
    if (json.error === "invalid_grant") {
      throw new SpotifyReauthRequired(json.error_description || json.error);
    }

    throw new Error(json.error_description || "Spotify token refresh failed");
  }

  // The response may carry a replacement refresh token. Persist it, or we
  // keep presenting a superseded one until the day it stops being accepted.
  if (json.refresh_token && json.refresh_token !== stored.token) {
    try {
      // Re-read first: a re-auth callback may have stored a brand-new grant
      // while this refresh was in flight, and rotation must not clobber it.
      const current = await getRedis().get<StoredToken>(STORE_KEY);
      if (!current || current.token === stored.token) {
        await getRedis().set(STORE_KEY, {
          authorized_at: stored.authorized_at,
          token: json.refresh_token,
        });
      }
    } catch (error) {
      // Bookkeeping only. The access token in hand is still good, and the
      // superseded refresh token retries next hour.
      console.error("Failed to persist rotated Spotify refresh token: ", error);
    }
  }

  cachedAccessToken = json.access_token;
  tokenExpiry = now + (json.expires_in - 60) * 1000; // 1 minute buffer
  return json.access_token;
};

export const exchangeAuthorizationCode = async (code: string) => {
  const response = await fetch(TOKEN_ENDPOINT, {
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      // Not a destination: an equality check against the URI the authorize
      // step used, byte for byte.
      redirect_uri: REDIRECT_URI,
    }),
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error_description || "Spotify code exchange failed");
  }

  return json as { access_token: string; refresh_token: string; scope: string };
};
