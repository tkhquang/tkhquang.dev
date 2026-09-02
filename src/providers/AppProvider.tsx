"use client";

import { STACKED_LAYER_1 } from "@/components/layout/StackedLayers";
import { DEFAULT_LOCALE, type Locale, type Messages } from "@/lib/i18n";
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
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: Locale;
  messages: Messages;
}) {
  const segments = useSelectedLayoutSegments();

  return (
    <StoreProvider>
      <IntlProvider
        messages={messages}
        locale={locale}
        defaultLocale={DEFAULT_LOCALE}
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
