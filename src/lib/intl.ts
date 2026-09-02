import { DEFAULT_LOCALE, getMessages, type Locale } from "@/lib/i18n";
import { createIntl, createIntlCache, type IntlShape } from "react-intl/server";

/**
 * Server-side twin of the `IntlProvider` in `AppProvider`. Server components
 * cannot read React context, so they format through one of these instead.
 * Both sides read `src/locales`, so there is one set of strings.
 *
 * The import is `react-intl/server`, not `react-intl`: since v10 the package's
 * main entry is marked `"use client"`, so importing it from a server component
 * would turn the caller into a client boundary. The `/server` entry carries
 * only the imperative formatters.
 *
 * The cache is module scope and shared across locales on purpose. It memoizes
 * the `Intl.*` constructors, which are the expensive part, keyed by the
 * arguments they were built with. The shapes wrapping it are memoized per
 * locale beside it, since a shape is immutable configuration once built and
 * holds nothing request-scoped.
 */
const cache = createIntlCache();

const intlByLocale = new Map<Locale, IntlShape>();

export const getIntl = (locale: Locale): IntlShape => {
  const cached = intlByLocale.get(locale);

  if (cached) {
    return cached;
  }

  const intl = createIntl(
    { defaultLocale: DEFAULT_LOCALE, locale, messages: getMessages(locale) },
    cache
  );
  intlByLocale.set(locale, intl);

  return intl;
};
