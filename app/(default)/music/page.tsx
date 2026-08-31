import NowPlayingHero from "@/components/spotify/NowPlayingHero";
import RecentlyPlayed from "@/components/spotify/RecentlyPlayed";
import TopItems from "@/components/spotify/TopItems";
import { GrowingUnderline } from "@/components/ui/growing-underline";
import {
  SPOTIFY_PROFILE_URL,
  TOP_ITEMS_TIME_RANGES,
} from "@/constants/spotify";
import { TopItemsTimeRange } from "@/models/samples/spotify.models";
import {
  getRecentlyPlayed,
  getTopArtists,
  getTopTracks,
} from "@/services/spotify";
import Link from "next/link";

/**
 * The recent-play window is the fastest-moving thing here. The top-item
 * fetches carry a longer cache of their own, so a revalidation only re-reads
 * the cheap endpoint most of the time.
 */
export const revalidate = 300;

const byTimeRange = <T,>(lists: T[][]) =>
  Object.fromEntries(
    TOP_ITEMS_TIME_RANGES.map(({ value }, index) => [value, lists[index]])
  ) as Record<TopItemsTimeRange, T[]>;

export default async function MusicPage() {
  const [recentlyPlayed, topTracks, topArtists] = await Promise.all([
    getRecentlyPlayed(50),
    Promise.all(TOP_ITEMS_TIME_RANGES.map(({ value }) => getTopTracks(value))),
    Promise.all(TOP_ITEMS_TIME_RANGES.map(({ value }) => getTopArtists(value))),
  ]);

  return (
    <div className="mt-header-height">
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <h1 className="heading--section text-4xl">Music 🎧</h1>
        <p className="text-theme-on-surface mt-4 mb-8 opacity-70">
          Whatever is on repeat at the moment, straight from{" "}
          <Link
            href={SPOTIFY_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium"
            title="My Spotify profile"
          >
            <GrowingUnderline>my Spotify profile</GrowingUnderline>
          </Link>
          .
        </p>

        <NowPlayingHero lastPlayed={recentlyPlayed[0] ?? null} />

        <section className="mt-12">
          <h2 className="heading--section text-2xl">On heavy rotation</h2>
          <p className="text-theme-on-surface mt-4 mb-6 text-sm opacity-60">
            Spotify works these out itself, which makes them the only long-range
            history it will hand over.
          </p>
          <TopItems
            artists={byTimeRange(topArtists)}
            tracks={byTimeRange(topTracks)}
          />
        </section>

        <section className="mt-12">
          <h2 className="heading--section text-2xl">Recently played</h2>
          <p className="text-theme-on-surface mt-4 mb-6 text-sm opacity-60">
            The API only exposes the last 50 plays, roughly three hours of
            listening, so this is the whole of it.
          </p>
          <RecentlyPlayed items={recentlyPlayed} />
        </section>
      </div>
    </div>
  );
}
