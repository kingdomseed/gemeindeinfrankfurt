"use client";

import { chakra } from "@chakra-ui/react";

import { cardRecipe } from "@/theme/box-recipes";

// An outlined box that sets a group apart without tinting it.
export const Card = chakra("div", cardRecipe);
