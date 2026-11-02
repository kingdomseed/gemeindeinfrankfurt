"use client";

import { HStack, Link } from "@chakra-ui/react";
import { useLocale } from "next-intl";

import { Link as LocaleLink, usePathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";

// Each language is named in itself, so someone who cannot read the current
// page can still find their own.
const nativeNames: Record<Locale, string> = { de: "Deutsch", en: "English", ru: "Русский" };

export function LanguageSwitcher({ label }: { label: string }) {
  const current = useLocale();
  const pathname = usePathname();
  return (
    <HStack as="nav" aria-label={label} gap="0" mr="-2" fontSize="sm">
      {locales.map((l) => {
        const active = l === current;
        return (
          <Link
            key={l}
            asChild
            minH="11"
            px="2"
            color={active ? "fg" : "fg.muted"}
            fontWeight={active ? "semibold" : "normal"}
            textDecoration={active ? "underline" : "none"}
            textDecorationThickness="2px"
            _hover={{ color: "fg", textDecoration: "underline" }}
          >
            <LocaleLink
              href={pathname}
              locale={l}
              lang={l}
              hrefLang={l}
              aria-current={active ? "page" : undefined}
            >
              {nativeNames[l]}
            </LocaleLink>
          </Link>
        );
      })}
    </HStack>
  );
}
