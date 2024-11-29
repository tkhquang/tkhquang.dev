"use client";

import { Provider, useSetAtom, WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import React, { createContext, useEffect } from "react";
import { themeModeStore, themeStore } from "@/src/store/theme";

export const AppContext = createContext<Record<string, unknown>>({});

const AtomsHydrator = ({
  atomValues,
  children,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  atomValues: Iterable<
    readonly [WritableAtom<unknown, [any], unknown>, unknown]
  >;
  children: React.ReactNode;
}) => {
  useHydrateAtoms(new Map(atomValues));
  return children;
};

const ThemeSetter = () => {
  const setTheme = useSetAtom(themeStore);

  useEffect(() => {
    window.__onThemeChange = setTheme;
    setTheme(window.__theme);
  }, []);

  return null;
};

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider>
      <AtomsHydrator atomValues={[]}>
        <ThemeSetter />
        <AppContext.Provider value={{}}>{children}</AppContext.Provider>
      </AtomsHydrator>
    </Provider>
  );
}
