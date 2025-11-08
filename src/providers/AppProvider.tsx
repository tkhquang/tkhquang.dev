"use client";

import { STACKED_LAYER_1 } from "@/components/layout/StackedLayers";
import StackedLayerProvider from "@/providers/StackedLayerProvider";
import StoreProvider from "@/providers/StoreProvider";
import { useSelectedLayoutSegments } from "next/navigation";
import React, { createContext } from "react";
import { IntlProvider } from "react-intl";

export const AppContext = createContext<
  { segments?: string[] } & Record<string, unknown>
>({});

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const segments = useSelectedLayoutSegments();

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
          <AppContext.Provider value={{ segments }}>
            {children}
          </AppContext.Provider>
        </StackedLayerProvider>
      </IntlProvider>
    </StoreProvider>
  );
}
