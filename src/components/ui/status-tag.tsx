"use client";

import { chakra } from "@chakra-ui/react";

import { statusTagRecipe } from "@/theme/box-recipes";

// A short status word on a tint, such as "Received".
export const StatusTag = chakra("span", statusTagRecipe);
