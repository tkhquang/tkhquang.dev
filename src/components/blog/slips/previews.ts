"use client";

import { useSyncExternalStore } from "react";

/* The reader's say over the slips, kept in the browser: a reader who
   would rather have plain links turns them off once and keeps them off
   on every page */
const STORAGE_KEY = "ljoss-previews";
const CHANGE_EVENT = "ljoss-previews-change";

const read = (): boolean => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
};

/* The document as served has previews on: the store corrects it right
   after hydration, before any slip could open */
const serverSnapshot = () => true;

const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGE_EVENT, onChange);
  /* Another tab turning them off reaches this one through storage */
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
};

export function setPreviewsEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, "off");
    }
  } catch {
    /* Storage refused: the choice lasts the page, through the event */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const usePreviewsEnabled = (): boolean =>
  useSyncExternalStore(subscribe, read, serverSnapshot);
