"use client";

import { useSyncExternalStore } from "react";

/* True when the reader's main pointer is a finger. Nothing hovers
   there, and a card anchored to a word has no room. */
let query: MediaQueryList | undefined;
const getQuery = () => (query ??= window.matchMedia("(pointer: coarse)"));

const subscribe = (onChange: () => void) => {
  const list = getQuery();
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
};

/* The server cannot know the pointer. Assume a mouse, then correct
   after hydration. */
const serverSnapshot = () => false;

export const usePointerCoarse = (): boolean =>
  useSyncExternalStore(subscribe, () => getQuery().matches, serverSnapshot);
