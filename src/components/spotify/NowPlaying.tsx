/**
 * Adapted from https://github.com/hta218/leohuynh.dev
 * Original author: Leo Huynh (hta218)
 * License: MIT
 */

"use client";

import Image from "@/components/common/NextImage";
import { GrowingUnderline } from "@/components/ui/growing-underline";
import { MusicWaves } from "@/components/ui/music-waves";
import { CurrentPlayingResponse } from "@/models/samples/spotify.models";
import { clsx } from "clsx";
import { intervalToDuration } from "date-fns";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SiSpotify } from "react-icons/si";

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
    <SiSpotify className="size-6 shrink-0" />
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
  showCover,
  songEffect = "none",
}: {
  className?: string;
  showCover?: boolean;
  songEffect?: "none" | "underline";
}) {
  const pathname = usePathname();
  const [data, setData] = useState<CurrentPlayingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const durationMs = data?.item?.duration_ms || 0;
  const progressMs = data?.progress_ms || 0;
  const remainingPlayingTime =
    durationMs > 0 ? Math.max(0, durationMs - progressMs) : null;

  // --- Fetch logic with abort signal ---
  const fetchSpotifyData = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setData(null);
    try {
      const response = await fetch("/api/spotify/current-playing", { signal });
      if (!response.ok) {
        console.warn(
          `/api/spotify/current-playing responded ${response.status}`
        );
        return;
      }
      const json: CurrentPlayingResponse = await response.json();
      setData(json);
    } catch (error: any) {
      if (error.name !== "AbortError") {
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

  // Fetch on mount & pathname change, with abort logic
  useEffect(() => {
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

  if (data === null) {
    return (
      <Fallback
        className={className}
        isLoading={isLoading}
        songEffect={songEffect}
      />
    );
  }

  const trackDuration = intervalToDuration({
    end: data.item?.duration_ms,
    start: 0,
  });

  const progressDuration = intervalToDuration({
    end: data.progress_ms,
    start: 0,
  });

  const artistName =
    data.item?.album?.artists?.map((artist) => artist.name).join(", ") ??
    "Spotify";

  return (
    <div className={clsx(["flex items-center", className])}>
      {showCover && data.item?.album.images?.[0]?.url ? (
        <div className="relative size-6 shrink-0 rounded-full">
          <Image
            fill
            sizes="24px"
            src={data.item?.album.images?.[0]?.url}
            alt={data.item?.album.name || "Now playing"}
            className="animate-spin rounded-full border border-gray-300 [animation-duration:6s] dark:border-gray-700"
          />
        </div>
      ) : (
        <SiSpotify className="size-6 shrink-0" />
      )}
      <div className="ml-2 flex items-center">
        <div className="grid max-w-full grid-cols-[auto_auto_minmax(0,1fr)] items-center truncate">
          {data.item?.external_urls?.spotify ? (
            <>
              <MusicWaves className="mr-2" />
              <Link
                href={data.item.external_urls.spotify}
                className="max-w-full shrink-0 truncate font-medium text-(--song-color)"
                title={`${data.item.name} - ${artistName}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {songEffect === "underline" ? (
                  <GrowingUnderline tone="spotify">{data.item.name}</GrowingUnderline>
                ) : (
                  <span>{data.item.name}</span>
                )}
              </Link>
            </>
          ) : (
            // Nothing else on the site links to /music yet, so the idle state
            // doubles as the way in.
            <Link
              href="/music"
              className="max-w-full shrink-0 truncate font-medium text-(--song-color)"
              title="What I have been listening to"
            >
              {songEffect === "underline" ? (
                <GrowingUnderline tone="spotify">Not Playing</GrowingUnderline>
              ) : (
                <span>Not Playing</span>
              )}
            </Link>
          )}
          <div className="inline-flex">
            <span className="mx-1 text-(--artist-color)">&middot;</span>
            <p className="spotify-artist max-w-full truncate text-(--artist-color) opacity-80">
              {artistName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
