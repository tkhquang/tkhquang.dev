import { TopItemsTimeRange } from "@/models/samples/spotify.models";

/**
 * Spotify computes these three windows itself; they are the only aggregate
 * history the Web API exposes, so they double as the site's listening history
 * for anything older than the 50-play recent window.
 *
 * This lives outside the components because the `/music` server component and
 * the client-side tabs both need it, and a value exported from a `"use client"`
 * module reaches the server as a module reference rather than the array.
 */
export const TOP_ITEMS_TIME_RANGES: {
  label: string;
  value: TopItemsTimeRange;
}[] = [
  { label: "Last 4 weeks", value: "short_term" },
  { label: "Last 6 months", value: "medium_term" },
  { label: "Last year", value: "long_term" },
];

/** The account every widget on this site is reading from. */
export const SPOTIFY_PROFILE_URL =
  "https://open.spotify.com/user/31jzoh4lzbzjmwijgsp4owpijlnu";
