"use client";

import { Flex, Link } from "@chakra-ui/react";

import { Link as LocaleLink, usePathname } from "@/i18n/navigation";

type NavItem = { href: string; label: string };

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// The current page is underlined in the brand colour. On phones the menu
// spans the screen under a thin line and spreads its links across it.
export function SiteNav({ label, items }: { label: string; items: readonly NavItem[] }) {
  const pathname = usePathname();
  return (
    <Flex
      as="nav"
      aria-label={label}
      gridArea="nav"
      wrap="wrap"
      justify={{ base: "space-between", md: "flex-end" }}
      columnGap={{ base: "0", md: "1" }}
      mx={{ base: "-4", md: "0" }}
      px={{ base: "1", md: "0" }}
      mt={{ base: "1.5", md: "0" }}
      borderTopWidth={{ base: "1px", md: "0" }}
    >
      {items.map((item) => {
        const current = isCurrent(pathname, item.href);
        return (
          <Link
            key={item.href}
            asChild
            minH="11"
            px="3"
            fontSize={{ base: "sm", sm: "md" }}
            fontWeight="medium"
            color={current ? "fg" : "fg.muted"}
            textDecoration="none"
            rounded={current ? "none" : "l2"}
            boxShadow={current ? "inset 0 -2px {colors.brand.solid}" : undefined}
            _hover={{ color: "fg", bg: current ? undefined : "bg.muted" }}
          >
            <LocaleLink href={item.href} aria-current={current ? "page" : undefined}>
              {item.label}
            </LocaleLink>
          </Link>
        );
      })}
    </Flex>
  );
}
