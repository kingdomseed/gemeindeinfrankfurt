"use client";

import { chakra, Text } from "@chakra-ui/react";

import { noticeRecipe } from "@/theme/box-recipes";

const Box = chakra("div", noticeRecipe);

// A date or figure on a tint with a label above and a note below, such as a
// deadline. "warning" marks the one that needs doing soon.
export function FactBox(props: {
  tone: "neutral" | "warning";
  label: string;
  value: string;
  note: string;
}) {
  const muted = props.tone === "neutral" ? "fg.muted" : undefined;
  return (
    <Box tone={props.tone} display="flex" flexDirection="column" gap="0.5">
      <Text fontSize="sm" fontWeight="medium" color={muted}>
        {props.label}
      </Text>
      <Text fontSize="xl" fontVariantNumeric="tabular-nums">
        {props.value}
      </Text>
      <Text fontSize="sm" color={muted} fontVariantNumeric="tabular-nums">
        {props.note}
      </Text>
    </Box>
  );
}
