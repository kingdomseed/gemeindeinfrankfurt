"use client";

import { Flex, Link } from "@chakra-ui/react";

import { Link as LocaleLink, usePathname } from "@/i18n/navigation";

type NavItem = { href: string; label: string };

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav({ label, items }: { label: string; items: readonly NavItem[] }) {
  const pathname = usePathname();
  return (
    <Flex as="nav" aria-label={label} wrap="wrap" columnGap="1" mx="-2" mt="1">
      {items.map((item) => {
        const current = isCurrent(pathname, item.href);
        return (
          <Link
            key={item.href}
            asChild
            minH="11"
            px="2"
            fontWeight="medium"
            color={current ? "fg" : "fg.muted"}
            textDecoration="none"
            borderBottomWidth="2px"
            borderColor={current ? "brand.solid" : "transparent"}
            _hover={{ color: "fg", borderColor: current ? "brand.solid" : "border.emphasized" }}
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
