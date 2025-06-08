"use client";

import { Provider, useSetAtom, WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import React, { useEffect } from "react";
import { useAsPathInitializer } from "@/store/router";
import { themeStore } from "@/store/theme";

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

const StoreSetter = () => {
  useAsPathInitializer();
  const setTheme = useSetAtom(themeStore);

  useEffect(() => {
    window.__onThemeChange = setTheme;
    setTheme(window.__theme);
  }, [setTheme]);

  return null;
};

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider>
      <AtomsHydrator atomValues={[]}>
        <StoreSetter />
        {children}
      </AtomsHydrator>
    </Provider>
  );
}
