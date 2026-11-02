import { defineRecipe, defineSlotRecipe } from "@chakra-ui/react";
import { checkboxAnatomy, nativeSelectAnatomy, radioGroupAnatomy } from "@chakra-ui/react/anatomy";

// Project defaults layered over Chakra's own recipes (the configs are merged):
// 44px controls for touch, and control borders that keep 3:1 contrast
// against the page (WCAG 1.4.11).
const strong = { borderColor: "border.emphasized" };
// Declares the existing `lg` size so it can be the default; Chakra's styles for
// it stay as they are.
const lg = { lg: {} };

export const recipes = {
  button: defineRecipe({ defaultVariants: { size: "lg" } }),
  input: defineRecipe({
    variants: { variant: { outline: strong }, size: lg },
    defaultVariants: { size: "lg" },
  }),
  textarea: defineRecipe({ variants: { variant: { outline: strong } } }),
};

export const slotRecipes = {
  nativeSelect: defineSlotRecipe({
    slots: nativeSelectAnatomy.keys(),
    variants: { variant: { outline: { field: strong } }, size: lg },
    defaultVariants: { size: "lg" },
  }),
  checkbox: defineSlotRecipe({
    slots: checkboxAnatomy.keys(),
    variants: { variant: { outline: { control: strong } }, size: lg },
    defaultVariants: { size: "lg" },
  }),
  radioGroup: defineSlotRecipe({
    slots: radioGroupAnatomy.keys(),
    variants: { variant: { outline: { itemControl: strong } }, size: lg },
    defaultVariants: { size: "lg" },
  }),
};
