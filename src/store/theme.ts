import { getCssVariables } from "@/utils/helpers";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useLayoutEffect } from "react";

export type ThemeMode = "dark" | "light";

export type WindowWithTheme = Window &
  typeof globalThis & {
    __onThemeChange?: (theme: ThemeMode) => void;
    __setPreferredTheme: (theme: ThemeMode) => void;
    __theme: ThemeMode;
  };

export type ThemeStore = {
  mode: ThemeMode;
  cssVariables: Record<string, string | number>;
  /* False until the initializer has copied the inline script's choice in.
     Before that `mode` is only the server default, not the reader's theme,
     and anything that bakes the mode into a URL or a request has to wait. */
  ready: boolean;
};

export const themeModeStore = atom<ThemeStore>({
  cssVariables: {},
  mode: "dark",
  ready: false,
});

export const themeStore = atom(
  (get) => get(themeModeStore),
  (get, set, mode: ThemeMode) => {
    set(themeModeStore, (prevState) => {
      const cssVariables = getCssVariables();
      return { cssVariables, mode, ready: true };
    });
  }
);

export const useThemeValue = () => useAtomValue(themeStore);

export const useThemeInitializer = () => {
  const setTheme = useSetAtom(themeStore);

  /* React 19 strips every script-set attribute from <html> when a hydration
     failure forces a root client render (react/react#37145), and the inline
     theme script never re-executes on that path. Re-assert the source of
     truth in the same commit, before paint, so the theme survives it. */
  useLayoutEffect(() => {
    const mode = window.__theme;
    const root = document.documentElement;
    if (mode && root.getAttribute("data-theme") !== mode) {
      root.setAttribute("data-theme", mode);
    }
  }, []);

  useEffect(() => {
    window.__onThemeChange = setTheme;
    setTheme(window.__theme);
  }, [setTheme]);
};
