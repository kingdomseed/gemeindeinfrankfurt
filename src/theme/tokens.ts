import { defineTokens } from "@chakra-ui/react";

// Raw palette from the Impeccable design pass. Components never use these
// directly; they use the semantic tokens in semantic-tokens.ts, which pick the
// light or dark value.
export const tokens = defineTokens({
  colors: {
    paper: {
      light: { value: "#fbfaf7" },
      dark: { value: "#12171b" },
    },
    ink: {
      light: { value: "#1c2329" },
      dark: { value: "#ece9e2" },
    },
    surface: {
      light: { value: "#f1efe9" },
      dark: { value: "#1b2227" },
    },
    muted: {
      light: { value: "#55606a" },
      dark: { value: "#a5aeb5" },
    },
    line: {
      light: { value: "#d9d5cc" },
      dark: { value: "#2f383f" },
      // Input and control borders: at least 3:1 against the page (WCAG 1.4.11).
      strongLight: { value: "#7d858c" },
      strongDark: { value: "#77818a" },
    },
    teal: {
      // Brand: solid and hover for each mode, its text colour, and a soft tint.
      light: { value: "#115e59" },
      lightHover: { value: "#0d4b47" },
      dark: { value: "#5eb8ad" },
      darkHover: { value: "#7ccabf" },
      inkLight: { value: "#ffffff" },
      inkDark: { value: "#0b1f1d" },
      softLight: { value: "#e5f1ef" },
      softDark: { value: "#16302d" },
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
    body: { value: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
    heading: { value: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  },
});
