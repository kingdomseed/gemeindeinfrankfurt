"use client";

import { Button, Icon, Menu, Portal } from "@chakra-ui/react";
import { useLocale } from "next-intl";

import { Link as LocaleLink, locales, usePathname, type Locale } from "@/i18n/navigation";

const nativeNames: Record<Locale, string> = { de: "Deutsch", en: "English", ru: "Русский" };

// Single compact dropdown trigger ("DE ▾") opening a menu with full native
// language names so someone who cannot read the current page can still find
// their own.
export function LanguageSwitcher({ label }: { label: string }) {
  const current = useLocale();
  const pathname = usePathname();
  const currentLocale: Locale = locales.find((l) => l === current) ?? "de";

  return (
    <Menu.Root positioning={{ placement: "bottom-end" }}>
      <Menu.Trigger asChild>
        <Button
          variant="ghost"
          size="sm"
          minH="11"
          px="2.5"
          me={{ md: "-2.5" }}
          gap="1.5"
          color="fg"
          fontWeight="medium"
          touchAction="manipulation"
          userSelect="none"
          aria-label={`${label}: ${nativeNames[currentLocale]}`}
        >
          {currentLocale.toUpperCase()}
          <Icon boxSize="3" color="fg.muted">
            <svg viewBox="0 0 10 10" aria-hidden="true">
              <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </Icon>
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="36">
            {locales.map((l) => {
              const active = l === currentLocale;
              return (
                <Menu.Item
                  key={l}
                  value={l}
                  asChild
                  textDecoration="none"
                  minH="10"
                  fontWeight={active ? "semibold" : "normal"}
                  color={active ? "brand.solid" : "fg"}
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
                </Menu.Item>
              );
            })}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
