"use client";

import { useSyncExternalStore } from "react";

interface LocalTimeProps {
  city: string;
  gmtLabel: string;
  timeZone: string;
}

const TICK_MS = 30_000;

function subscribeToTick(onTick: () => void) {
  const interval = setInterval(onTick, TICK_MS);

  return () => {
    clearInterval(interval);
  };
}

/**
 * Floored to the tick so repeated reads return an identical value, which
 * useSyncExternalStore requires; a raw Date.now() would re-render forever.
 * Flooring to 30s never crosses a minute boundary, so the displayed time is
 * the same one a fresh Date would show.
 */
function getTick(): number {
  return Math.floor(Date.now() / TICK_MS) * TICK_MS;
}

/**
 * No clock on the server, which keeps the static fallback in the server markup
 * and in the hydrating render.
 */
function getServerTick(): null {
  return null;
}

/**
 * Offset of a time zone relative to the viewer, in hours. Quarter-hour
 * rounding covers every real zone, including the 45-minute ones.
 */
function offsetFromViewer(timeZone: string, now: Date): number {
  const here = new Date(now.toLocaleString("en-US"));
  const there = new Date(now.toLocaleString("en-US", { timeZone }));
  return Math.round(((there.getTime() - here.getTime()) / 3_600_000) * 4) / 4;
}

/**
 * "Based in" value with a live clock in the owner's time zone and the
 * difference to the viewer's clock. Renders the static fallback until
 * mounted so server and client markup agree.
 */
const LocalTime = ({ city, gmtLabel, timeZone }: LocalTimeProps) => {
  const tick = useSyncExternalStore(subscribeToTick, getTick, getServerTick);
  const now = tick === null ? null : new Date(tick);

  if (now === null) {
    return (
      <span>
        {city} · {gmtLabel}
      </span>
    );
  }

  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone,
  }).format(now);

  const diff = offsetFromViewer(timeZone, now);
  const diffText =
    diff === 0
      ? "Same time as you"
      : `${Math.abs(diff)}h ${diff > 0 ? "ahead of" : "behind"} you`;

  return (
    <span>
      {city} · {time} {gmtLabel}
      <span className="block font-mono text-[0.7rem] leading-5 opacity-75">
        {diffText}
      </span>
    </span>
  );
};

export default LocalTime;
