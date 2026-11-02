import { defineSemanticTokens } from "@chakra-ui/react";

// Chakra's own tokens are written as { _light, _dark } and the configs are
// deep-merged, so ours must use the same keys to replace both values.
const mode = (light: string, dark: string) => ({
  value: { _light: `{colors.${light}}`, _dark: `{colors.${dark}}` },
});

// Chakra's own semantic token names (bg, fg, border, fg.error, ...) mapped to
// our palette, so every built-in component picks up the brand in both modes.
export const semanticTokens = defineSemanticTokens({
  colors: {
    bg: {
      DEFAULT: mode("paper.light", "paper.dark"),
      subtle: mode("surface.light", "surface.dark"),
      muted: mode("surface.light", "surface.dark"),
      panel: mode("paper.light", "paper.dark"),
      success: mode("status.successBgLight", "status.successBgDark"),
      warning: mode("status.warningBgLight", "status.warningBgDark"),
      error: mode("status.dangerBgLight", "status.dangerBgDark"),
    },
    fg: {
      DEFAULT: mode("ink.light", "ink.dark"),
      muted: mode("muted.light", "muted.dark"),
      success: mode("status.successFgLight", "status.successFgDark"),
      warning: mode("status.warningFgLight", "status.warningFgDark"),
      error: mode("status.dangerFgLight", "status.dangerFgDark"),
    },
    border: {
      DEFAULT: mode("line.light", "line.dark"),
      muted: mode("line.light", "line.dark"),
      emphasized: mode("line.strongLight", "line.strongDark"),
    },
    // A full colour palette, so `colorPalette="brand"` works on any component.
    brand: {
      solid: mode("teal.light", "teal.dark"),
      emphasized: mode("teal.lightHover", "teal.darkHover"),
      contrast: mode("teal.inkLight", "teal.inkDark"),
      fg: mode("teal.light", "teal.dark"),
      muted: mode("teal.softLight", "teal.softDark"),
      subtle: mode("teal.softLight", "teal.softDark"),
      focusRing: mode("teal.light", "teal.dark"),
      border: mode("teal.light", "teal.dark"),
    },
  },
});
