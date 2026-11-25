import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

import { recipes, slotRecipes } from "./recipes";
import { semanticTokens } from "./semantic-tokens";
import { tokens } from "./tokens";

const config = defineConfig({
  globalCss: {
    // Native controls and scrollbars follow the colour mode too, and the
    // scrollbar takes the page's own colours. The stable gutter keeps the
    // centred layout still when a page is too short to scroll.
    html: {
      colorPalette: "brand",
      colorScheme: "light",
      scrollbarGutter: "stable",
      scrollbarColor: "{colors.border.emphasized} {colors.bg}",
    },
    "html.dark": { colorScheme: "dark" },
    body: { accentColor: "brand.solid" },
    "a, button, input, select, textarea, label": { touchAction: "manipulation" },
    "h1[id], h2[id], h3[id]": { scrollMarginTop: "2rem" },
    "::selection": { bg: "brand.subtle", color: "fg" },
    a: { textUnderlineOffset: "0.2em" },
  },
  theme: { tokens, semanticTokens, recipes, slotRecipes },
});

export const system = createSystem(defaultConfig, config);
