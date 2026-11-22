import { Link } from "@chakra-ui/react";

import { Link as LocaleLink } from "@/i18n/navigation";

// The solid button that leads from a homepage section to its page.
export function ReadMoreLink(props: { href: string; label: string; describedBy: string }) {
  return (
    <Link
      asChild
      minH="12"
      px="6"
      rounded="l2"
      bg="brand.solid"
      color="brand.contrast"
      fontWeight="semibold"
      textDecoration="none"
      _hover={{ bg: "brand.emphasized", color: "brand.contrast" }}
    >
      <LocaleLink href={props.href} aria-describedby={props.describedBy}>
        {props.label}
      </LocaleLink>
    </Link>
  );
}
