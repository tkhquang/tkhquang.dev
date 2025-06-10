import { getCssVariables } from "@/utils/helpers";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

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

export const useThemeValue = () => useAtomValue(themeStore);

export const useThemeInitializer = () => {
  const setTheme = useSetAtom(themeStore);

  useEffect(() => {
    window.__onThemeChange = setTheme;
    setTheme(window.__theme);
  }, [setTheme]);
};
