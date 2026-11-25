"use client";

import { Flex, Link } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

import { Link as LocaleLink, usePathname } from "@/i18n/navigation";

// `exact` marks an item that is current only on its own page, not on the pages below it.
type NavItem = { href: string; label: string; exact: boolean };

function isCurrent(pathname: string, { href, exact }: NavItem) {
  return pathname === href || (!exact && pathname.startsWith(`${href}/`));
}

export function SiteNav({ label, items }: { label: string; items: readonly NavItem[] }) {
  const pathname = usePathname();
  const currentHref = items.find((item) => isCurrent(pathname, item))?.href;
  const navRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());

  useEffect(() => {
    const nav = navRef.current;
    const link = currentHref ? linkRefs.current.get(currentHref) : undefined;
    if (!nav || !link) return;
    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    if (linkRect.left < navRect.left) {
      nav.scrollLeft -= navRect.left - linkRect.left + 16;
    } else if (linkRect.right > navRect.right) {
      nav.scrollLeft += linkRect.right - navRect.right + 16;
    }
  }, [currentHref]);

  return (
    <Flex
      ref={navRef}
      as="nav"
      aria-label={label}
      flexWrap="nowrap"
      overflowX="auto"
      columnGap="1"
      mx={{ base: "-4", md: "-2" }}
      px={{ base: "4", md: "0" }}
      mb="-1px"
      scrollbarWidth="none"
      overscrollBehaviorX="contain"
      css={{ "&::-webkit-scrollbar": { display: "none" } }}
    >
      {items.map((item) => {
        const current = item.href === currentHref;
        return (
          <Link
            key={item.href}
            asChild
            flexShrink={0}
            whiteSpace="nowrap"
            display="inline-flex"
            alignItems="center"
            minH="11"
            px="2.5"
            fontSize="sm"
            fontWeight="medium"
            touchAction="manipulation"
            userSelect="none"
            color={current ? "fg" : "fg.muted"}
            textDecoration="none"
            borderBottomWidth="2px"
            borderColor={current ? "brand.solid" : "transparent"}
            _hover={{ color: "fg", borderColor: current ? "brand.solid" : "border.emphasized" }}
          >
            <LocaleLink
              ref={(el) => {
                if (el) linkRefs.current.set(item.href, el);
                else linkRefs.current.delete(item.href);
              }}
              href={item.href}
              aria-current={current ? "page" : undefined}
            >
              {item.label}
            </LocaleLink>
          </Link>
        );
      })}
    </Flex>
  );
}
