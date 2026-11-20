"use client";

import { chakra } from "@chakra-ui/react";

// Styles long-form HTML that arrives as plain elements (p, h2–h4, a, hr,
// lists), such as rich text from the CMS.
export const Prose = chakra("div", {
  base: {
    color: "fg",
    lineHeight: "1.7",
    overflowWrap: "break-word",
    "& p": { mb: "4" },
    "& h2, & h3, & h4": { fontWeight: "semibold", lineHeight: "short", mt: "8", mb: "3" },
    "& h2": { fontSize: "2xl" },
    "& h3": { fontSize: "xl" },
    "& h4": { fontSize: "lg" },
    "& > :first-child": { mt: "0" },
    "& > :last-child": { mb: "0" },
    "& strong": { fontWeight: "semibold" },
    "& a": { color: "brand.fg", textDecoration: "underline" },
    "& a:hover": { color: "brand.emphasized" },
    "& hr": { borderColor: "border", my: "8" },
    "& ul, & ol": { ps: "6", mb: "4" },
    "& ul": { listStyleType: "disc" },
    "& ol": { listStyleType: "decimal" },
    "& li": { mb: "1" },
    "& blockquote": { ps: "4", borderStartWidth: "2px", borderColor: "border", color: "fg.muted" },
  },
});
