"use client";

import { useAsPathInitializer } from "@/store/router";
import { useThemeInitializer } from "@/store/theme";
import { Provider, WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import React, { Suspense } from "react";

const AtomsHydrator = ({
  atomValues,
  children,
}: {
  atomValues: Iterable<
    readonly [WritableAtom<unknown, [any], unknown>, unknown]
  >;
  children: React.ReactNode;
}) => {
  useHydrateAtoms(new Map(atomValues));
  return children;
};

const StoreSetter = () => {
  useThemeInitializer();
  useAsPathInitializer();

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
        <Suspense>
          <StoreSetter />
        </Suspense>
        {children}
      </AtomsHydrator>
    </Provider>
  );
}
