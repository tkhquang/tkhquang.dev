/**
 * Adapted from https://github.com/hta218/leohuynh.dev
 * Original author: Leo Huynh (hta218)
 * License: MIT
 */

import { clsx } from "clsx";

export function MusicWaves({ className }: { className?: string }) {
  return (
    <div className={clsx("flex h-5 shrink-0 items-end pt-1 pb-0.5", className)}>
      <div className="animate-music-bar-1 h-full w-0.5 bg-[#1ED760]" />
      <div className="animate-music-bar-2 mx-0.5 h-1/2 w-0.5 bg-[#1ED760]" />
      <div className="animate-music-bar-3 h-full w-0.5 bg-[#1ED760]" />
      <div className="animate-music-bar-4 mx-0.5 h-1/2 w-0.5 bg-[#1ED760]" />
    </div>
  );
}
