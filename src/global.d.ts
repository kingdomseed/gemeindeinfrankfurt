import type { routing } from "@/i18n/routing";

import type messages from "../messages/en.json";

// Types next-intl's locale and message keys, so a missing or misspelled
// translation key fails the type check instead of rendering the raw key.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
