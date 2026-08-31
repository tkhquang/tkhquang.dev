/**
 * Adapted from https://github.com/hta218/leohuynh.dev
 * Original author: Leo Huynh (hta218)
 * License: MIT
 */

import { clsx } from "clsx";

export function MusicWaves({ className }: { className?: string }) {
  return (
    <div className={clsx("flex h-5 shrink-0 items-end pb-0.5 pt-1", className)}>
      <div className="h-full w-0.5 animate-music-bar-1 bg-[#1ED760]" />
      <div className="mx-0.5 h-1/2 w-0.5 animate-music-bar-2 bg-[#1ED760]" />
      <div className="h-full w-0.5 animate-music-bar-3 bg-[#1ED760]" />
      <div className="mx-0.5 h-1/2 w-0.5 animate-music-bar-4 bg-[#1ED760]" />
    </div>
  );
}
