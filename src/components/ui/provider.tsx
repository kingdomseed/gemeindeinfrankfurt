"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { system } from "@/theme";

import { EmotionRegistry } from "./emotion-registry";

// Light by default, whatever the device prefers; a visitor can switch to dark
// with the button in the footer, and next-themes remembers it. next-themes sets
// the `dark` class that Chakra's `_dark` tokens read.
export function Provider({ children }: { children: ReactNode }) {
  return (
    <EmotionRegistry>
      <ChakraProvider value={system}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </ChakraProvider>
    </EmotionRegistry>
  );
}
