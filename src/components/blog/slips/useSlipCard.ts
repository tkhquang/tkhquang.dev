"use client";

import type { SlipCard } from "@/lib/slips/card";
import { useSyncExternalStore } from "react";

export type SlipCardState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; card: SlipCard }
  | { status: "missing" }
  | { status: "failed" };

/* One fetch per key for the life of the page: the cards are static
   files, so a card read once is the card */
const states = new Map<string, SlipCardState>();
const listeners = new Map<string, Set<() => void>>();
const IDLE: SlipCardState = { status: "idle" };

const notify = (key: string) => {
  for (const listener of listeners.get(key) ?? []) listener();
};

/**
 * Starts the card's fetch if it has not started: hover intent and focus
 * call this ahead of the slip opening, so the card is usually there
 * when the slip is. A fetch that failed is tried again on the next
 * call, which the next open makes.
 */
export function prefetchSlipCard(key: string): void {
  const current = states.get(key);
  if (current && current.status !== "failed") return;
  states.set(key, { status: "loading" });
  notify(key);
  fetch(`/blog/slips/${key}`, { headers: { Accept: "application/json" } })
    .then(async (response) => {
      if (!response.ok) throw new Error(`${response.status}`);
      const card = (await response.json()) as SlipCard | null;
      states.set(key, card ? { status: "ready", card } : { status: "missing" });
    })
    .catch(() => {
      states.set(key, { status: "failed" });
    })
    .finally(() => notify(key));
}

export function useSlipCard(key: string): SlipCardState {
  return useSyncExternalStore(
    (onChange) => {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(onChange);
      return () => {
        set.delete(onChange);
      };
    },
    () => states.get(key) ?? IDLE,
    () => IDLE
  );
}
