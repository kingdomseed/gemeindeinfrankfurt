import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";

import { routing, type Locale } from "./routing";

// Narrows the [locale] route param. Unknown locales render the 404 page.
export function requireLocale(value: string): Locale {
  if (!hasLocale(routing.locales, value)) notFound();
  return value;
}
