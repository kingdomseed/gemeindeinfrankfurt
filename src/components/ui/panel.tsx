"use client";

import { chakra } from "@chakra-ui/react";

import { panelRecipe } from "@/theme/box-recipes";

// A tinted block that holds one task. `tone` picks brand, success or neutral.
export const Panel = chakra("section", panelRecipe);
