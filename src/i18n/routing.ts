import { defineRouting } from "next-intl/routing";

export const locales = ["de", "en", "ru"] as const;
export type Locale = (typeof locales)[number];

// German lives at the bare domain (/, /fur-besucher); English and Russian
// carry their prefix (/en, /ru). Old /de/... links redirect to the bare path.
// The browser's language and earlier choices are not used, so the bare domain
// is always German.
export const routing = defineRouting({
  locales,
  defaultLocale: "de",
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
});

// A path in one language, for links built outside next-intl's <Link>, such as
// rich text and emails: "/x" in German, "/en/x" in English.
export function localePath(locale: Locale, path: string): string {
  if (locale === routing.defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
