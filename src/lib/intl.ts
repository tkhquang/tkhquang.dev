import messages from "@/locales/en.json";
import { createIntl, createIntlCache } from "react-intl/server";

/**
 * Server-side twin of the `IntlProvider` in `AppProvider`. Server components
 * cannot read React context, so they format through this instance instead.
 * Both sides read `src/locales/en.json`, so there is one set of strings.
 *
 * That file is hand-maintained in the runtime shape `IntlProvider` wants,
 * `{ id: "ICU string" }`, rather than the `{ id: { defaultMessage } }` shape
 * `formatjs extract` emits. Adopting the extract/compile pipeline later means
 * pointing both readers at the compiled output instead of at this file.
 *
 * The import is `react-intl/server`, not `react-intl`: since v10 the package's
 * main entry is marked `"use client"`, so importing it from a server component
 * would turn the caller into a client boundary. The `/server` entry carries
 * only the imperative formatters.
 *
 * The cache memoizes the `Intl.*` constructors, which are expensive to build;
 * without one, every formatter call would construct its own.
 */
const cache = createIntlCache();

export const intl = createIntl(
  { defaultLocale: "en", locale: "en", messages },
  cache
);
