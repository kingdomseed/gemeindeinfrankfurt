import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing, type Locale } from "./routing";

const loaders = {
  de: () => import("../../messages/de.json"),
  en: () => import("../../messages/en.json"),
  ru: () => import("../../messages/ru.json"),
} satisfies Record<Locale, () => Promise<unknown>>;

// oxlint-disable-next-line typescript/no-deprecated -- moving to next/root-params is a separate change.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    timeZone: "Europe/Berlin",
    messages: (await loaders[locale]()).default,
  };
});
