import { defineRecipe } from "@chakra-ui/react";

// The boxes the screens are built from. Components get their look only from
// these recipes, so a theme change is made here once.

// A tinted block that holds one task, such as the transfer details.
export const panelRecipe = defineRecipe({
  className: "panel",
  base: { display: "flex", flexDirection: "column", gap: "4", rounded: "xl", p: "5" },
  variants: {
    tone: {
      brand: { bg: "brand.subtle", color: "fg" },
      success: { bg: "bg.success", color: "fg.success" },
      neutral: { bg: "bg.subtle", color: "fg" },
    },
  },
  defaultVariants: { tone: "brand" },
});

// An outlined box that sets a group apart without tinting it, such as rules.
export const cardRecipe = defineRecipe({
  className: "card",
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "2",
    borderWidth: "1px",
    borderColor: "border",
    rounded: "lg",
    p: "4",
    bg: "bg",
    color: "fg",
  },
});

// A message block: the result of an action, a warning or a plain note.
export const noticeRecipe = defineRecipe({
  className: "notice",
  base: { display: "block", rounded: "lg", p: "4", outline: "none" },
  variants: {
    tone: {
      neutral: { bg: "bg.subtle", color: "fg" },
      success: { bg: "bg.success", color: "fg.success" },
      warning: { bg: "bg.warning", color: "fg.warning" },
      error: { bg: "bg.error", color: "fg.error" },
    },
  },
  defaultVariants: { tone: "neutral" },
});

// A word on a tint, such as "Received" next to a payment line.
export const statusTagRecipe = defineRecipe({
  className: "status-tag",
  base: {
    display: "inline-flex",
    alignItems: "center",
    minH: "6",
    px: "2",
    rounded: "sm",
    fontSize: "xs",
    fontWeight: "medium",
    whiteSpace: "nowrap",
  },
  variants: {
    tone: {
      neutral: { bg: "bg.subtle", color: "fg.muted" },
      success: { bg: "bg.success", color: "fg.success" },
      warning: { bg: "bg.warning", color: "fg.warning" },
      error: { bg: "bg.error", color: "fg.error" },
      brand: { bg: "brand.subtle", color: "brand.fg" },
    },
  },
  defaultVariants: { tone: "neutral" },
});
