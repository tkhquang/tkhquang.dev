/**
 * Adapted from https://github.com/hta218/leohuynh.dev
 * Original author: Leo Huynh (hta218)
 * License: MIT
 */

"use client";

import Image from "@/components/common/NextImage";
import { GrowingUnderline } from "@/components/ui/growing-underline";
import { MusicWaves } from "@/components/ui/music-waves";
import { CurrentPlayingRouteResponse } from "@/models/samples/spotify.models";
import { clsx } from "clsx";
import { formatDistanceToNowStrict } from "date-fns";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { SiSpotify } from "react-icons/si";

const FADE_CLASS = "transition-[opacity,visibility] duration-100";

const Fallback = ({
  className,
  isLoading,
  songEffect,
}: {
  className?: string;
  isLoading: boolean;
  songEffect?: "none" | "underline";
}) => (
  <div className={clsx(["flex items-center", className])}>
    <SiSpotify className="size-6 shrink-0" aria-hidden="true" />
    <div className="ml-2 inline-flex truncate">
      {isLoading ? (
        <p className="font-medium text-(--song-color)">Loading...</p>
      ) : (
        // A failed fetch lands here. /music renders without the live
        // endpoint, so the link stays useful.
        <Link
          href="/music"
          className="font-medium text-(--song-color)"
          title="What I have been listening to"
        >
          {songEffect === "underline" ? (
            <GrowingUnderline tone="spotify">Not Playing</GrowingUnderline>
          ) : (
            "Not Playing"
          )}
        </Link>
      )}
    </div>
  </div>
);

export default function SpotifyNowPlaying({
  className,
  compact,
  showCover,
  songEffect = "none",
}: {
  className?: string;
  /** Show a status placeholder until hovered or tapped */
  compact?: boolean;
  showCover?: boolean;
  songEffect?: "none" | "underline";
}) {
  const pathname = usePathname();
  const [data, setData] = useState<CurrentPlayingRouteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasDataRef = useRef(false);
  const lastFetchedAtRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const lineId = useId();

  /* The line stays open only on the page it was opened on. A stale path is
     dropped during render rather than in an effect: Back and Forward never
     reach the outside-tap listener below, and returning to the page must not
     find the line still open. */
  const [expandedOn, setExpandedOn] = useState<string | null>(null);
  if (expandedOn !== null && expandedOn !== pathname) {
    setExpandedOn(null);
  }
  const isExpanded = expandedOn === pathname;

  // Without a track loaded, the route answers with the newest play instead
  const lastPlayed = data && "lastPlayed" in data ? data.lastPlayed : null;
  const current = data && !("lastPlayed" in data) ? data : null;

  const durationMs = current?.item?.duration_ms || 0;
  const progressMs = current?.progress_ms || 0;
  const remainingPlayingTime =
    durationMs > 0 ? Math.max(0, durationMs - progressMs) : null;

  // --- Fetch logic with abort signal ---
  const fetchSpotifyData = async (signal?: AbortSignal) => {
    /* Revalidate silently once a song is showing: wiping to Loading on
       every in-blog navigation made the footer flicker for the same track */
    if (!hasDataRef.current) {
      setIsLoading(true);
    }
    try {
      const response = await fetch("/api/spotify/current-playing", { signal });
      if (!response.ok) {
        console.warn(
          `/api/spotify/current-playing responded ${response.status}`
        );
        return;
      }
      const json: CurrentPlayingRouteResponse = await response.json();
      setData(json);
      hasDataRef.current = true;
      lastFetchedAtRef.current = Date.now();
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("fetchSpotifyData: ", error);
      }
    } finally {
      // An aborted call hands the state to the newer one. Do not end the
      // loading phase from here.
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  // Fetch on mount & pathname change, with abort logic. Navigation alone
  // is not a reason to ask again: within the staleness window the shown
  // track is kept and the track-end timer below still forces a refetch.
  useEffect(() => {
    const STALE_AFTER_MS = 30_000;
    if (
      hasDataRef.current &&
      Date.now() - lastFetchedAtRef.current < STALE_AFTER_MS
    ) {
      return;
    }

    const abortController = new AbortController();
    fetchSpotifyData(abortController.signal);

    return () => abortController.abort();
  }, [pathname]);

  // Auto-refetch after track ends, if playing
  useEffect(() => {
    if (!remainingPlayingTime || remainingPlayingTime <= 0) return;

    const timeout = setTimeout(() => {
      const abortController = new AbortController();
      fetchSpotifyData(abortController.signal);
    }, remainingPlayingTime + 5_000);

    return () => {
      clearTimeout(timeout);
      // DO NOT abort the controller here, since it's local to the timer callback!
    };
  }, [remainingPlayingTime, pathname]);

  // A tap anywhere outside the widget closes the line
  useEffect(() => {
    if (!isExpanded) return;

    const collapse = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setExpandedOn(null);
      }
    };
    document.addEventListener("pointerdown", collapse);

    return () => document.removeEventListener("pointerdown", collapse);
  }, [isExpanded]);

  // Compact sends a failed fetch on to the placeholder below, which still
  // opens a line that links to /music
  if (data === null && (isLoading || !compact)) {
    return (
      <Fallback
        className={className}
        isLoading={isLoading}
        songEffect={songEffect}
      />
    );
  }

  // A paused track is still the live one, but it gets no waves or spin
  const isPlaying = Boolean(current?.item && current.is_playing);
  const track = current?.item ?? lastPlayed?.track;
  const songName = track?.name ?? "Not Playing";
  const artistName =
    track?.album?.artists?.map((artist) => artist.name).join(", ") ?? "Spotify";
  const cover = showCover ? track?.album?.images?.[0]?.url : undefined;
  const title = track
    ? `${track.name} - ${artistName}`
    : "What I have been listening to";
  const status = isPlaying
    ? "Now Playing"
    : current?.item
      ? "Paused"
      : "Not Playing";

  const coverArt = cover ? (
    <span className="relative block size-6 shrink-0 rounded-full">
      <Image
        fill
        sizes="24px"
        src={cover}
        alt={track?.album?.name || "Now playing"}
        className={clsx([
          "rounded-full border border-gray-300 dark:border-gray-700",
          // The footer stays on screen while a post is read, so compact
          // keeps the motion down to the waves
          isPlaying && !compact && "animate-spin [animation-duration:6s]",
        ])}
      />
    </span>
  ) : (
    <SiSpotify className="size-6 shrink-0" aria-hidden="true" />
  );

  const withEffect = (text: string) =>
    songEffect === "underline" ? (
      <GrowingUnderline tone="spotify">{text}</GrowingUnderline>
    ) : (
      <span>{text}</span>
    );

  /* Compact crossfades two layers that share a cell: what shows at rest (the
     placeholder, and the Spotify icon in place of a last played cover) and
     what shows on reveal (the line and that cover). Nothing moves on hover.
     The side going out fades first and the side coming in waits out the
     same 100ms, so the two never overlap half drawn. `invisible` also drops
     the hidden side from the tab order and the hit test, which keeps an
     unseen link from catching a tap. Tailwind's hover variants apply only
     where a pointer can hover, so on touch the reveal follows the button. */
  const atRestClassName = clsx([
    FADE_CLASS,
    isExpanded
      ? "invisible opacity-0"
      : "delay-100 group-hover/now-playing:invisible group-hover/now-playing:opacity-0 group-hover/now-playing:delay-0",
  ]);
  const onRevealClassName = clsx([
    FADE_CLASS,
    isExpanded
      ? "visible opacity-100 delay-100"
      : "invisible opacity-0 group-hover/now-playing:visible group-hover/now-playing:opacity-100 group-hover/now-playing:delay-100",
  ]);

  const line = (
    <div
      id={compact ? lineId : undefined}
      className={clsx([
        // The time column is the one that never shrinks, so a last played
        // line still says it is old
        "grid max-w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center truncate",
        compact && [
          // Positioned, so it sits above the button's widened tap target
          "relative col-start-2 row-start-1",
          onRevealClassName,
        ],
      ])}
    >
      {/* Every state links to /music rather than out to Spotify, so the
          widget is the way into the page */}
      <Link
        href="/music"
        className="max-w-full truncate font-medium text-(--song-color)"
        title={title}
      >
        {withEffect(songName)}
      </Link>
      <div className="inline-flex">
        <span className="mx-1 text-(--artist-color)">&middot;</span>
        <Link
          href="/music"
          className="max-w-full truncate text-(--artist-color) opacity-80"
          title={title}
        >
          {withEffect(artistName)}
        </Link>
      </div>
      {lastPlayed && (
        <div className="inline-flex">
          <span className="mx-1 text-(--artist-color)">&middot;</span>
          <time
            dateTime={lastPlayed.played_at}
            className="text-(--artist-color) opacity-80"
          >
            {formatDistanceToNowStrict(new Date(lastPlayed.played_at), {
              addSuffix: true,
            })}
          </time>
        </div>
      )}
    </div>
  );

  if (!compact) {
    return (
      <div className={clsx(["flex items-center gap-2", className])}>
        {coverArt}
        {isPlaying && <MusicWaves />}
        {line}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={clsx([
        // Fit the content, so only the widget itself answers hover
        "group/now-playing grid w-fit max-w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2",
        className,
      ])}
    >
      {/* The root is a two-column grid, media then text. The button spans
          both as a subgrid, so the cover and the placeholder land in those
          columns and the whole row is one tap target. The line holds links,
          which cannot nest inside a button, so it is a sibling placed in the
          text column over the placeholder. The ::after grows the tap target
          to 44px tall whatever the text size resolves to. The label is set
          explicitly because the placeholder it repeats is hidden while the
          line shows, which would drop it from the computed name. */}
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={lineId}
        aria-label={`${status} on Spotify`}
        className="relative col-span-full row-start-1 grid cursor-pointer grid-cols-subgrid items-center text-left after:absolute after:inset-x-0 after:inset-y-[calc((100%-44px)/2)]"
        onClick={() => setExpandedOn(isExpanded ? null : pathname)}
      >
        <span className="flex items-center gap-2">
          {/* Nothing is playing, so at rest it is only Spotify. The last
              track's cover arrives with its line. */}
          {lastPlayed && cover ? (
            <span className="grid">
              <SiSpotify
                className={clsx([
                  "col-start-1 row-start-1 size-6",
                  atRestClassName,
                ])}
                aria-hidden="true"
              />
              <span
                className={clsx(["col-start-1 row-start-1", onRevealClassName])}
              >
                {coverArt}
              </span>
            </span>
          ) : (
            coverArt
          )}
          {isPlaying && <MusicWaves />}
        </span>
        <span className={clsx(["truncate", atRestClassName])}>
          <span className="font-medium text-(--song-color)">{status}</span>
          <span className="mx-1 text-(--artist-color)">&middot;</span>
          <span className="text-(--artist-color) opacity-80">Spotify</span>
        </span>
      </button>
      {line}
    </div>
  );
}
