"use client";

import { STACKED_LAYER_1 } from "@/components/layout/StackedLayers";
import StackedLayerProvider from "@/providers/StackedLayerProvider";
import StoreProvider from "@/providers/StoreProvider";
import React, { createContext } from "react";
import { IntlProvider } from "react-intl";

export const AppContext = createContext<Record<string, unknown>>({});

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
      <IntlProvider
        messages={{
          duration: "{minutes, number, ::00}:{seconds, number, ::00}",
        }}
        locale="en"
        defaultLocale="en"
      >
        <StackedLayerProvider id={STACKED_LAYER_1}>
          <AppContext.Provider value={{}}>{children}</AppContext.Provider>
        </StackedLayerProvider>
      </IntlProvider>
    </StoreProvider>
  );
}
