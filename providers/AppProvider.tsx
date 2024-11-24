"use client";

import { Provider, WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import React, { createContext, useEffect, useState } from "react";
import { getCssVariables } from "@/utils/helpers";
import { themeModeStore, themeStore } from "@/src/store/theme";

export const AppContext = createContext({
  cssVariables: {} as Record<string, string | number>,
});

function AtomsHydrator({
  atomValues,
  children,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  atomValues: Iterable<
    readonly [WritableAtom<unknown, [any], unknown>, unknown]
  >;
  children: React.ReactNode;
}) {
  useHydrateAtoms(new Map(atomValues));
  return children;
}

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cssVariables, setCssVariables] = useState<
    Record<string, string | number>
  >({});

  useEffect(() => {
    setCssVariables(getCssVariables());
  }, []);

  return (
    <Provider>
      <AtomsHydrator
        atomValues={
          [
            // ..
            // [themeStore, { mode: "dark", cssVariables: {} }],
          ]
        }
      >
        <AppContext.Provider
          value={{
            cssVariables,
          }}
        >
          {children}
        </AppContext.Provider>
      </AtomsHydrator>
    </Provider>
  );
}
