"use client";

import { Button, Span } from "@chakra-ui/react";
import { useTheme } from "next-themes";

// Switches between light and dark. The page is rendered before the stored
// choice is known, so both labels are in the markup and the `dark` class on
// <html> shows the right one, without a flash or a hydration mismatch.
export function ColorModeButton(props: { toDark: string; toLight: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="plain"
      size="sm"
      minH="11"
      px="0"
      color="fg.muted"
      fontWeight="normal"
      textDecoration="underline"
      textDecorationColor="border.emphasized"
      _hover={{ color: "fg", textDecorationColor: "currentColor" }}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Span _dark={{ display: "none" }}>{props.toDark}</Span>
      <Span display="none" _dark={{ display: "inline" }}>
        {props.toLight}
      </Span>
    </Button>
  );
}
