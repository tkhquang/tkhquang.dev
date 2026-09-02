import { useCallback, useSyncExternalStore } from "react";

// The --breakpoint-* custom properties only exist once the stylesheet is
// applied, so the widths can never be read while rendering on the server.
// Resolve them on first client use and keep them: they are compiled into the
// stylesheet and do not change for the life of the page.
let screens: Record<string, string> | null = null;

const getScreens = (): Record<string, string> => {
  if (screens) {
    return screens;
  }

  // One declaration for the whole pass: reading the computed style inside
  // the reduce would force a style resolve per breakpoint.
  const style = window.getComputedStyle(document.body);

  screens = Array.from(style).reduce<Record<string, string>>(
    (obj, property) => {
      if (property.startsWith("--breakpoint-")) {
        obj[property.replace("--breakpoint-", "")] =
          style.getPropertyValue(property);
      }

      return obj;
    },
    {}
  );

  return screens;
};

// The lists are cached per query too, because getSnapshot runs on every render
// and has to return a value that only changes when the match does. Building a
// fresh MediaQueryList each call would also mean a forced style read per render.
const queryLists = new Map<string, MediaQueryList>();

const getQueryList = (query: string): MediaQueryList => {
  let matchQueryList = queryLists.get(query);

  if (!matchQueryList) {
    matchQueryList = window.matchMedia(`(min-width: ${getScreens()[query]})`);
    queryLists.set(query, matchQueryList);
  }

  return matchQueryList;
};

// The server has no viewport and no computed styles to match against, so it
// renders false and the store corrects the value right after hydration.
const getServerSnapshot = (): boolean => false;

const useUpBreakpoint = (query: string): boolean => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const matchQueryList = getQueryList(query);

      matchQueryList.addEventListener("change", onStoreChange);
      return () => {
        matchQueryList.removeEventListener("change", onStoreChange);
      };
    },
    [query]
  );

  const getSnapshot = useCallback(() => getQueryList(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

export default useUpBreakpoint;
