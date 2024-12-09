import { canUseDOM } from "@ariakit/core/utils/dom";
import { debounce } from "debounce";
import { atom } from "jotai";
import { getCssVariables } from "@/utils/helpers";

const DEFAULT_THEME_MODE = "dark";

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
};

export const themeModeStore = atom<ThemeStore>({
  cssVariables: {},
  mode: "dark",
});

export const themeStore = atom(
  (get) => get(themeModeStore),
  (get, set, mode: ThemeMode) => {
    set(themeModeStore, (prevState) => {
      const cssVariables = getCssVariables();
      return { cssVariables, mode };
    });
  }
);

export const scrolledStore = atom<{ isScrolled: boolean }>({
  isScrolled: false,
});

scrolledStore.onMount = (set) => {
  const checkIfIsScrolled = debounce(() => {
    const top = window.scrollY || 0;

    set({
      isScrolled: top > 600 - 96,
    });
  }, 5);
  checkIfIsScrolled();

  window.addEventListener("scroll", checkIfIsScrolled);

  return () => {
    window.removeEventListener("scroll", checkIfIsScrolled);
  };
};
