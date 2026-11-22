import { defineTokens } from "@chakra-ui/react";

// Warm palette of the homepage design (prototype 7, Nov 2026). Components never use these
// directly; they use the semantic tokens in semantic-tokens.ts, which pick the
// light or dark value.
export const tokens = defineTokens({
  colors: {
    paper: {
      light: { value: "#fffdf9" },
      dark: { value: "#17130f" },
    },
    ink: {
      light: { value: "#241c15" },
      dark: { value: "#f1ebe3" },
    },
    // Panels such as the contact box, and a deeper tint for quiet bars.
    surface: {
      light: { value: "#f7f1e8" },
      dark: { value: "#211b16" },
      deepLight: { value: "#f1e8db" },
      deepDark: { value: "#2c241c" },
    },
    muted: {
      light: { value: "#6a5e52" },
      dark: { value: "#b7aa9b" },
    },
    line: {
      light: { value: "#e8ddcd" },
      dark: { value: "#352c23" },
      // Input and control borders: at least 3:1 against the page (WCAG 1.4.11).
      strongLight: { value: "#8c7d6c" },
      strongDark: { value: "#7a6c5d" },
    },
    bronze: {
      // Brand: solid and hover for each mode, its text colour, and a soft tint.
      light: { value: "#7f5226" },
      lightHover: { value: "#6a4420" },
      dark: { value: "#e0a86e" },
      darkHover: { value: "#ebbd8c" },
      inkLight: { value: "#ffffff" },
      inkDark: { value: "#1b140d" },
      softLight: { value: "#f3e6d6" },
      softDark: { value: "#33261a" },
    },
    status: {
      successBgLight: { value: "#e8f4ea" },
      successBgDark: { value: "#14301d" },
      successFgLight: { value: "#1d5a2c" },
      successFgDark: { value: "#a9dcb5" },
      warningBgLight: { value: "#fbf1dc" },
      warningBgDark: { value: "#352710" },
      warningFgLight: { value: "#7a4b07" },
      warningFgDark: { value: "#f3cf8c" },
      dangerBgLight: { value: "#fdeceb" },
      dangerBgDark: { value: "#3a1a17" },
      dangerFgLight: { value: "#b42318" },
      dangerFgDark: { value: "#f2877d" },
    },
  },
  fonts: {
    // Self-hosted through Fontsource (imported in the locale layout), so no
    // visitor data goes to a font service. Both cover Cyrillic.
    body: { value: '"Inter Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
    heading: { value: '"Source Serif 4 Variable", Georgia, "Times New Roman", serif' },
  },
});
