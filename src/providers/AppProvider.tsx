"use client";

import React, { createContext } from "react";
import StackedLayerProvider from "@/providers/StackedLayerProvider";
import { STACKED_LAYER_1 } from "@/components/layout/StackedLayers";
import StoreProvider from "@/providers/StoreProvider";

export const AppContext = createContext<Record<string, unknown>>({});

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
      <StackedLayerProvider id={STACKED_LAYER_1}>
        <AppContext.Provider value={{}}>{children}</AppContext.Provider>
      </StackedLayerProvider>
    </StoreProvider>
  );
}
