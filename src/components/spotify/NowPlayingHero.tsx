"use client";

import {
  AlbumLink,
  ArtistLinks,
  CoverArt,
  getArtistNames,
  pickImage,
  handleRowClick,
  SpotifyLink,
  underlineClassName,
} from "@/components/spotify/ItemRow";
import { GrowingUnderline } from "@/components/ui/growing-underline";
import { MusicWaves } from "@/components/ui/music-waves";
import {
  CurrentPlayingResponse,
  PlayHistoryItem,
} from "@/models/samples/spotify.models";
import { formatTrackDuration } from "@/utils/date";
import { clsx } from "clsx";
import { formatDistanceToNowStrict } from "date-fns";
import { useEffect, useState } from "react";
import { SiSpotify } from "react-icons/si";

// Nothing is playing, so there is no track end to schedule against. Poll slowly
// so the hero wakes up if playback starts while the page is open.
const IDLE_POLL_MS = 60_000;

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-theme-on-surface flex items-center justify-center gap-2 text-xs font-bold tracking-wider uppercase opacity-60 sm:justify-start">
    {children}
  </div>
);

export default function NowPlayingHero({
  lastPlayed,
}: {
  lastPlayed: PlayHistoryItem | null;
}) {
  const [current, setCurrent] = useState<CurrentPlayingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progressMs, setProgressMs] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();

    (async () => {
      try {
        const response = await fetch("/api/spotify/current-playing", {
          signal: abortController.signal,
        });

        if (!response.ok) {
          setCurrent(null);
          return;
        }

        // The route answers `false` when the endpoint returns 204 or the item
        // is not a track (a podcast episode, say).
        const json = await response.json();
        const playing = json?.item ? (json as CurrentPlayingResponse) : null;

        setCurrent(playing);
        setProgressMs(playing?.progress_ms ?? 0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("NowPlayingHero: ", error);
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => abortController.abort();
  }, [reloadKey]);

  const isPlaying = Boolean(current?.is_playing);
  const durationMs = current?.item?.duration_ms ?? 0;

  // Advance the bar locally instead of re-polling every second.
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const interval = setInterval(() => {
      setProgressMs((previous) => Math.min(previous + 1000, durationMs));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, durationMs]);

  // Refetch just after the expected end of the current track, or on a slow loop
  // while idle. `reloadKey` re-arms the timer even when a fetch leaves the
  // state untouched, so the idle poll does not stall.
  useEffect(() => {
    if (!isPlaying) {
      const timeout = setTimeout(
        () => setReloadKey((key) => key + 1),
        IDLE_POLL_MS
      );

      return () => clearTimeout(timeout);
    }

    const remaining = Math.max(0, durationMs - (current?.progress_ms ?? 0));
    const timeout = setTimeout(
      () => setReloadKey((key) => key + 1),
      remaining + 5_000
    );

    return () => clearTimeout(timeout);
  }, [current, durationMs, isPlaying, reloadKey]);

  /**
   * Until the live fetch lands, `lastPlayed` is only a guess - it is the right
   * answer when nothing is playing and the wrong track when something is. The
   * server cannot tell the difference, because its copy of the page is up to
   * five minutes old. So hold the card empty rather than render a track that
   * has to be swapped out from under whoever is already reading it.
   */
  const track = isLoading ? null : (current?.item ?? lastPlayed?.track ?? null);
  const cover = pickImage(track?.album?.images, 300);
  const progressPercent =
    isPlaying && durationMs > 0
      ? Math.min(100, (progressMs / durationMs) * 100)
      : 0;

  return (
    <div
      className={clsx([
        // Same contract as the list rows: the card delegates its clicks, and
        // `group` drives the underline on card hover.
        "bg-theme-surface shadow-box group flex flex-col items-center gap-5 rounded-lg p-5",
        "hover:shadow-box-md transition-shadow duration-200",
        "sm:flex-row sm:items-start",
        track && "cursor-pointer",
      ])}
      onClick={(event) => handleRowClick(track?.external_urls?.spotify, event)}
    >
      <CoverArt
        className="size-32 rounded-md shadow-md"
        sizes="128px"
        src={cover}
        href={track?.album?.external_urls?.spotify}
        alt={track?.album?.name || track?.name || "Album art"}
        fallback={
          isLoading ? (
            <div className="bg-theme-background size-full animate-pulse" />
          ) : (
            <div className="flex-center bg-theme-background size-full">
              <SiSpotify className="size-10 opacity-30" />
            </div>
          )
        }
      />

      <div className="min-w-0 flex-1 text-center sm:text-left">
        {isLoading ? (
          <Label>Loading&hellip;</Label>
        ) : isPlaying ? (
          <Label>
            <MusicWaves />
            Now playing
          </Label>
        ) : current ? (
          <Label>Paused</Label>
        ) : lastPlayed ? (
          <Label>
            <SiSpotify className="size-4 text-[#1ED760]" />
            Last played{" "}
            <time dateTime={lastPlayed.played_at}>
              {formatDistanceToNowStrict(new Date(lastPlayed.played_at), {
                addSuffix: true,
              })}
            </time>
          </Label>
        ) : (
          <Label>
            <SiSpotify className="size-4 text-[#1ED760]" />
            Not playing
          </Label>
        )}

        {isLoading ? (
          // Same heights as the real thing, so nothing jumps when it arrives.
          <div className="mt-2 space-y-2" aria-hidden>
            <div className="bg-theme-background mx-auto h-7 w-3/5 animate-pulse rounded sm:mx-0" />
            <div className="bg-theme-background mx-auto h-5 w-2/5 animate-pulse rounded sm:mx-0" />
            <div className="bg-theme-background mx-auto h-4 w-1/4 animate-pulse rounded sm:mx-0" />
          </div>
        ) : track ? (
          <>
            <SpotifyLink
              href={track.external_urls?.spotify}
              className="mt-2 inline-block max-w-full truncate text-2xl font-bold"
              title={`${track.name} - ${getArtistNames(track)}`}
            >
              <GrowingUnderline className={underlineClassName}>
                {track.name}
              </GrowingUnderline>
            </SpotifyLink>
            <p className="text-theme-on-surface max-w-full truncate opacity-80">
              <ArtistLinks track={track} />
            </p>
            <p className="text-theme-on-surface max-w-full truncate text-sm opacity-60">
              <AlbumLink track={track} />
            </p>
          </>
        ) : (
          <p className="mt-2 text-2xl font-bold">Silence</p>
        )}

        {isPlaying && durationMs > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-theme-on-surface shrink-0 font-mono text-xs tabular-nums opacity-60">
              {formatTrackDuration(progressMs)}
            </span>
            <div
              className="bg-theme-background h-1 flex-1 overflow-hidden rounded-full"
              role="progressbar"
              aria-label="Track progress"
              aria-valuemin={0}
              aria-valuemax={Math.round(durationMs / 1000)}
              aria-valuenow={Math.round(progressMs / 1000)}
            >
              <div
                className={clsx([
                  "h-full rounded-full bg-[#1ED760]",
                  "transition-[width] duration-1000 ease-linear",
                ])}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-theme-on-surface shrink-0 font-mono text-xs tabular-nums opacity-60">
              {formatTrackDuration(durationMs)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
