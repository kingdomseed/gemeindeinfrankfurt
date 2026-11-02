"use client";

import { useLocale } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";

export function LanguageSwitcher() {
  const current = useLocale();
  const pathname = usePathname();
  return (
    <nav className="flex gap-3 text-sm">
      {locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          aria-current={l === current ? "true" : undefined}
          className={l === current ? "font-bold underline" : "hover:underline"}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
