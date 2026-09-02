import en from "@/locales/en.json";

/**
 * Every locale the site serves. Adding one means dropping its JSON into
 * `src/locales`, listing it here, and registering it in `MESSAGES` below.
 * The `Record<Locale, Messages>` type makes the third step a compile error
 * rather than a missing-message warning at runtime.
 */
export const LOCALES = ["en"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * The routes carry no locale segment yet, so this stands in everywhere a
 * route locale will eventually come from. Grep for it to find every call
 * site that has to start reading `params.locale` once `app/[locale]` lands.
 */
export const DEFAULT_LOCALE: Locale = "en";

export type Messages = typeof en;

/**
 * Registered statically rather than behind a dynamic `import()`: these are
 * local JSON files of a few hundred bytes, and a static map keeps
 * `getMessages` synchronous, so reading a string never forces a call site to
 * become async. Swap in `import()` here if the catalogs ever grow enough to
 * be worth loading one at a time.
 */
const MESSAGES: Record<Locale, Messages> = { en };

export const getMessages = (locale: Locale): Messages => MESSAGES[locale];
