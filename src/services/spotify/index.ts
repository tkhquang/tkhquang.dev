"use server";

import querystring from "querystring";
import { CurrentPlayingResponse } from "@/models/samples/spotify.models";
const {
  SPOTIFY_CLIENT_ID: client_id,
  SPOTIFY_CLIENT_SECRET: client_secret,
  SPOTIFY_REFRESH_TOKEN: refresh_token,
} = process.env;

const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString(
  "base64"
);
const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

// In-memory cache (good enough for Vercel/Netlify functions, single serverless instance)
let cachedAccessToken: string | null = null;
let tokenExpiry = 0;

const getAccessToken = async () => {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiry) {
    return { access_token: cachedAccessToken };
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    body: querystring.stringify({
      grant_type: "refresh_token",
      refresh_token,
    }),
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const json = await response.json();
  if (!response.ok)
    throw new Error(json.error_description || "Spotify token fetch failed");

  cachedAccessToken = json.access_token;
  tokenExpiry = now + (json.expires_in - 60) * 1000; // 1 minute buffer
  return json;
};

export const getNowPlaying = async () => {
  try {
    const { access_token } = await getAccessToken();
    const response = (await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })) as Response & { data: CurrentPlayingResponse };

    if (response.status === 204 || response.status > 400) {
      return false;
    }

    const json: CurrentPlayingResponse = await response.json();

    if (json.currently_playing_type !== "track") {
      return false;
    }

    return json;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
