"use client";

import { useSyncExternalStore } from "react";

/* Whether the reader's main pointer is a finger: a phone or a tablet,
   where nothing hovers and a card anchored to a word has no room */
let query: MediaQueryList | undefined;
const getQuery = () => (query ??= window.matchMedia("(pointer: coarse)"));

const subscribe = (onChange: () => void) => {
  const list = getQuery();
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
};

/* The document as served is set for a mouse; the store corrects it
   right after hydration */
const serverSnapshot = () => false;

export const usePointerCoarse = (): boolean =>
  useSyncExternalStore(subscribe, () => getQuery().matches, serverSnapshot);
