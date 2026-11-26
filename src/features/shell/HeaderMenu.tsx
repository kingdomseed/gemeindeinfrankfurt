"use client";

import { Box, Button, Flex, Link } from "@chakra-ui/react";
import { useState, type ReactNode } from "react";

import { Link as LocaleLink, usePathname } from "@/i18n/navigation";

import { MembersMenu } from "./MembersMenu";
import { currentStyle, isCurrent, menuItemStyle } from "./navStyles";

type NavItem = { href: string; label: string };

// The site name centred with the language codes at the right, and the menu
// centred under them. On phones the menu folds behind a "Menü" button and
// opens as a list under the top row.
export function HeaderMenu(props: {
  brand: ReactNode;
  languages: ReactNode;
  items: readonly NavItem[];
  members: readonly NavItem[];
  labels: { nav: string; menu: string; close: string; members: string };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Flex
        position="relative"
        align="center"
        justify={{ base: "space-between", md: "center" }}
        gap="2"
        minH={{ base: "16", md: "20" }}
      >
        {props.brand}
        <Box
          position={{ md: "absolute" }}
          insetEnd={{ md: "0" }}
          top={{ md: "50%" }}
          transform={{ md: "translateY(-50%)" }}
          ms={{ base: "auto", md: "0" }}
        >
          {props.languages}
        </Box>
        <Button
          hideFrom="md"
          variant="outline"
          size="sm"
          minH="11"
          px="3"
          flexShrink="0"
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? props.labels.close : props.labels.menu}
        </Button>
      </Flex>
      <Box
        display={{ base: "grid", md: "block" }}
        gridTemplateRows={{ base: open ? "1fr" : "0fr", md: "none" }}
        mx={{ base: "-4", md: "0" }}
        transition={{ base: "grid-template-rows 200ms {easings.ui-out}", md: "none" }}
        _motionReduce={{ transition: "none" }}
      >
        <Box
          as="nav"
          id="site-menu"
          aria-label={props.labels.nav}
          minH={{ base: "0", md: "auto" }}
          overflow={{ base: "hidden", md: "visible" }}
          visibility={{ base: open ? "visible" : "hidden", md: "visible" }}
          opacity={{ base: open ? 1 : 0, md: 1 }}
          transform={{ base: open ? "translateY(0)" : "translateY(-6px)", md: "none" }}
          transition={{
            base: open
              ? "opacity 200ms {easings.ui-out}, transform 200ms {easings.ui-out}, visibility 0ms"
              : "opacity 200ms {easings.ui-out}, transform 200ms {easings.ui-out}, visibility 0ms 200ms",
            md: "none",
          }}
          _motionReduce={{
            transform: "none",
            transition: {
              base: open
                ? "opacity 150ms ease, visibility 0ms"
                : "opacity 150ms ease, visibility 0ms 150ms",
              md: "none",
            },
          }}
        >
          <Box
            px={{ base: "3", md: "0" }}
            pt={{ base: "2", md: "0" }}
            pb={{ base: "3", md: "1.5" }}
            borderTopWidth={{ base: "1px", md: "0" }}
          >
            <Flex
              as="ul"
              listStyleType="none"
              direction={{ base: "column", md: "row" }}
              justify="center"
              wrap="wrap"
              columnGap="2"
            >
              {props.items.map((item) => {
                const current = isCurrent(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link asChild {...menuItemStyle} {...currentStyle(current)}>
                      <LocaleLink
                        href={item.href}
                        aria-current={current ? "page" : undefined}
                        onClick={close}
                      >
                        {item.label}
                      </LocaleLink>
                    </Link>
                  </li>
                );
              })}
              <MembersMenu label={props.labels.members} items={props.members} onNavigate={close} />
            </Flex>
          </Box>
        </Box>
      </Box>
    </>
  );
}
