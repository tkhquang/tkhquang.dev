import { getCssVariables } from "@/utils/helpers";
import { atom } from "jotai";

const DEFAULT_THEME_MODE = "dark";

export type ThemeMode = "dark" | "light";

export type WindowWithTheme = Window &
  typeof globalThis & {
    __onThemeChange: (theme: ThemeMode) => void;
    __setPreferredTheme: (theme: ThemeMode) => void;
    __theme: ThemeMode;
  };

export type ThemeStore = {
  mode: ThemeMode;
  cssVariables: Record<string, string | number>;
};

export const themeModeStore = atom<ThemeStore>({
  mode: "dark",
  cssVariables: {},
});

themeModeStore.onMount = (set) => {
  (function (window) {
    window.__onThemeChange = function () {};
    function setTheme(newTheme: ThemeMode) {
      window.__theme = newTheme;
      preferredTheme = newTheme;
      document.body.setAttribute("data-theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
      window.__onThemeChange(newTheme);
    }

    let preferredTheme!: ThemeMode;
    try {
      preferredTheme = localStorage.getItem("theme") as ThemeMode;
    } catch (err) {}

    window.__setPreferredTheme = function (newTheme) {
      setTheme(newTheme);
      try {
        localStorage.setItem("theme", newTheme);
      } catch (err) {}
    };

    let darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    darkQuery.addListener(function (e) {
      window.__setPreferredTheme(e.matches ? "dark" : "light");
    });

    setTheme(preferredTheme || (darkQuery.matches ? "dark" : "light"));

    const cssVariables = getCssVariables();
    set({
      mode: window.__theme || DEFAULT_THEME_MODE,
      cssVariables,
    });
  })(window as WindowWithTheme);

  return () => {};
};

export const themeStore = atom(
  (get) => get(themeModeStore),
  (get, set, mode: ThemeMode) => {
    set(themeModeStore, (prevState) => {
      (window as WindowWithTheme).__setPreferredTheme(mode);
      const cssVariables = getCssVariables();
      return { mode, cssVariables };
    });
  }
);
