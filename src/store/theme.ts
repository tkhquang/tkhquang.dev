import { canUseDOM } from "@ariakit/core/utils/dom";
import { getCssVariables } from "@/utils/helpers";
import { atom } from "jotai";

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
  mode: "dark",
  cssVariables: {},
});

export const themeStore = atom(
  (get) => get(themeModeStore),
  (get, set, mode: ThemeMode) => {
    set(themeModeStore, (prevState) => {
      const cssVariables = getCssVariables();
      return { mode, cssVariables };
    });
  }
);
