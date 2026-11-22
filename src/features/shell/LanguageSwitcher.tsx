"use client";

import { HStack, Link, VisuallyHidden } from "@chakra-ui/react";
import { useLocale } from "next-intl";

import { Link as LocaleLink, locales, usePathname, type Locale } from "@/i18n/navigation";

// Short codes keep the header to one row. Screen readers also hear each
// language named in itself, so someone who cannot read the current page can
// still find their own.
const nativeNames: Record<Locale, string> = { de: "Deutsch", en: "English", ru: "Русский" };

export function LanguageSwitcher({ label }: { label: string }) {
  const current = useLocale();
  const pathname = usePathname();
  return (
    <HStack
      as="nav"
      aria-label={label}
      gridArea="lang"
      gap="0"
      me={{ base: "-2", md: "-3" }}
      ps={{ md: "3" }}
      borderStartWidth={{ md: "1px" }}
      fontSize="sm"
    >
      {locales.map((l) => {
        const active = l === current;
        return (
          <Link
            key={l}
            asChild
            minW="11"
            minH="11"
            justifyContent="center"
            rounded="l2"
            color={active ? "fg" : "fg.muted"}
            fontWeight={active ? "semibold" : "normal"}
            textDecoration={active ? "underline" : "none"}
            textDecorationThickness="2px"
            textDecorationColor="brand.solid"
            _hover={{ color: "fg", bg: "bg.muted" }}
          >
            <LocaleLink
              href={pathname}
              locale={l}
              lang={l}
              hrefLang={l}
              aria-current={active ? "page" : undefined}
            >
              {l.toUpperCase()}
              <VisuallyHidden> {nativeNames[l]}</VisuallyHidden>
            </LocaleLink>
          </Link>
        );
      })}
    </HStack>
  );
}
