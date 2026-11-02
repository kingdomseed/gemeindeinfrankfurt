"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";

// Each language is named in itself, so someone who cannot read the current
// page can still find their own.
const nativeNames: Record<Locale, string> = { de: "Deutsch", en: "English", ru: "Русский" };

export function LanguageSwitcher({ label }: { label: string }) {
  const current = useLocale();
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="-mr-2 flex text-sm">
      {locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          lang={l}
          hrefLang={l}
          aria-current={l === current ? "page" : undefined}
          className={`inline-flex min-h-11 items-center px-2 ${
            l === current ? "font-semibold underline decoration-2" : "text-muted hover:text-foreground hover:underline"
          }`}
        >
          {nativeNames[l]}
        </Link>
      ))}
    </nav>
  );
}
