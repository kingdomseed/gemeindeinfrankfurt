"use client";

import { chakra } from "@chakra-ui/react";

import { markRecipe } from "@/theme/box-recipes";

// A toggle for one attendance mark; `aria-pressed` shows it is set.
export const MarkButton = chakra("button", markRecipe);
