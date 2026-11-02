"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { system } from "@/theme";

import { EmotionRegistry } from "./emotion-registry";

// Colour mode follows the device setting; next-themes sets the `dark` class
// that Chakra's `_dark` tokens read.
export function Provider({ children }: { children: ReactNode }) {
  return (
    <EmotionRegistry>
      <ChakraProvider value={system}>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </ChakraProvider>
    </EmotionRegistry>
  );
}
