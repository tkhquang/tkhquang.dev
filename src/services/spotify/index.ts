import {
  CurrentPlayingResponse,
  RecentlyPlayedResponse,
  SpotifyArtist,
  SpotifyTrack,
  TopItemsResponse,
  TopItemsTimeRange,
} from "@/models/samples/spotify.models";
import { getAccessToken } from "@/services/spotify/token";
import "server-only";

const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const RECENTLY_PLAYED_ENDPOINT = `https://api.spotify.com/v1/me/player/recently-played`;
const TOP_ITEMS_ENDPOINT = `https://api.spotify.com/v1/me/top`;

export const getNowPlaying = async () => {
  try {
    const accessToken = await getAccessToken();
    const response = await fetch(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 204 || response.status > 400) {
      return false;
    }

    const json: CurrentPlayingResponse = await response.json();

    if (json.currently_playing_type !== "track") {
      return false;
    }

    return json;
  } catch (error) {
    console.error("getNowPlaying: ", error);
    throw error;
  }
};

/**
 * Read endpoints backing the /music page. Unlike `getNowPlaying`, these never
 * throw: the page renders four independent sections and one failing endpoint
 * must blank that section, not the route. A 403 here almost always means the
 * stored refresh token predates the scope the endpoint needs; see
 * docs/spotify/README.md.
 */
const fetchFromSpotify = async <T>(
  endpoint: string,
  revalidate: number
): Promise<T | null> => {
  try {
    const accessToken = await getAccessToken();
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      next: { revalidate },
    });

    if (!response.ok) {
      console.error(
        `Spotify ${endpoint} responded ${response.status}: ${await response.text()}`
      );
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`fetchFromSpotify(${endpoint}): `, error);
    return null;
  }
};

// A busy day overruns the 50-play window in about three hours, so there is no
// point revalidating slower than this.
const RECENTLY_PLAYED_REVALIDATE = 300;
// Spotify recomputes affinity on its own schedule; daily is already generous.
// In practice an entry dies with the access token (~hourly), because Next keys
// the fetch cache on the Authorization header. Hourly is still cheap.
const TOP_ITEMS_REVALIDATE = 86400;

/**
 * The last 50 plays. That is the whole window Spotify exposes: `before` and
 * `after` only paginate inside it, so there is no deeper history to request.
 */
export const getRecentlyPlayed = async (limit = 50) => {
  const json = await fetchFromSpotify<RecentlyPlayedResponse>(
    `${RECENTLY_PLAYED_ENDPOINT}?limit=${limit}`,
    RECENTLY_PLAYED_REVALIDATE
  );

  return json?.items ?? [];
};

export const getTopTracks = async (
  timeRange: TopItemsTimeRange,
  limit = 10
) => {
  const json = await fetchFromSpotify<TopItemsResponse<SpotifyTrack>>(
    `${TOP_ITEMS_ENDPOINT}/tracks?time_range=${timeRange}&limit=${limit}`,
    TOP_ITEMS_REVALIDATE
  );

  return json?.items ?? [];
};

export const getTopArtists = async (
  timeRange: TopItemsTimeRange,
  limit = 10
) => {
  const json = await fetchFromSpotify<TopItemsResponse<SpotifyArtist>>(
    `${TOP_ITEMS_ENDPOINT}/artists?time_range=${timeRange}&limit=${limit}`,
    TOP_ITEMS_REVALIDATE
  );

  return json?.items ?? [];
};
