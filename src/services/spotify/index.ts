import querystring from "querystring";
import { CurrentPlayingResponse } from "@/models/samples/spotify.models";

const {
  SPOTIFY_CLIENT_ID: client_id,
  SPOTIFY_CLIENT_SECRET: client_secret,
  SPOTIFY_REFRESH_TOKEN: refresh_token,
} = process.env;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

const getAccessToken = async () => {
  const response = await fetch(TOKEN_ENDPOINT, {
    body: querystring.stringify({
      grant_type: "refresh_token",
      refresh_token,
    }),
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  return response.json();
};

export const getNowPlaying = async () => {
  try {
    const { access_token } = await getAccessToken();
    const response = (await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })) as Response & { data: CurrentPlayingResponse };

    const json = await response.json();

    if (
      response.status === 204 ||
      response.status > 400 ||
      json.currently_playing_type !== "track"
    ) {
      return false;
    }

    return json;
  } catch (error) {
    console.error(error);
  }
};
