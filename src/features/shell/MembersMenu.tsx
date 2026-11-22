"use client";

import { Box, Button, Icon, Link } from "@chakra-ui/react";
import { useEffect, useId, useRef, useState } from "react";

import { Link as LocaleLink, usePathname } from "@/i18n/navigation";

import { currentStyle, isCurrent, menuItemStyle } from "./navStyles";

type NavItem = { href: string; label: string };

// "Mitglieder" opens the pages for members of the church. On wider screens
// the list drops down under the button; Escape or a click elsewhere closes
// it. On phones it opens in place inside the menu.
export function MembersMenu(props: {
  label: string;
  items: readonly NavItem[];
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const rootRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const current = props.items.some((item) => isCurrent(pathname, item.href));

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <Box as="li" ref={rootRef} position="relative">
      <Button
        ref={buttonRef}
        variant="plain"
        h="auto"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        {...menuItemStyle}
        {...currentStyle(current)}
      >
        {props.label}
        <Icon
          boxSize="3"
          transition="transform 0.15s"
          transform={open ? "rotate(180deg)" : undefined}
          _motionReduce={{ transition: "none" }}
        >
          <svg viewBox="0 0 10 10" aria-hidden="true">
            <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </Icon>
      </Button>
      <Box
        as="ul"
        id={listId}
        hidden={!open}
        listStyleType="none"
        position={{ md: "absolute" }}
        insetStart={{ md: "50%" }}
        top={{ md: "100%" }}
        transform={{ md: "translateX(-50%)" }}
        zIndex="dropdown"
        minW={{ md: "56" }}
        mt={{ base: "0", md: "1.5" }}
        mb={{ base: "1", md: "0" }}
        ms={{ base: "3", md: "0" }}
        ps={{ base: "2", md: "1.5" }}
        pe={{ md: "1.5" }}
        py={{ md: "1.5" }}
        bg="bg.panel"
        borderStartWidth="1px"
        borderWidth={{ md: "1px" }}
        rounded={{ md: "l3" }}
        shadow={{ md: "md" }}
      >
        {props.items.map((item) => {
          const active = isCurrent(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                asChild
                display="flex"
                minH="11"
                px="3"
                rounded="l2"
                color="fg"
                fontWeight={active ? "semibold" : "normal"}
                textDecoration="none"
                _hover={{ bg: "bg.subtle" }}
              >
                <LocaleLink
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    setOpen(false);
                    props.onNavigate();
                  }}
                >
                  {item.label}
                </LocaleLink>
              </Link>
            </li>
          );
        })}
      </Box>
    </Box>
  );
}
