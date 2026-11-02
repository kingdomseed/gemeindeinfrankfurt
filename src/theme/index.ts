import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

import { recipes, slotRecipes } from "./recipes";
import { semanticTokens } from "./semantic-tokens";
import { tokens } from "./tokens";

const config = defineConfig({
  globalCss: {
    // Native controls and scrollbars follow the colour mode too.
    html: { colorPalette: "brand", colorScheme: "light" },
    "html.dark": { colorScheme: "dark" },
    body: { accentColor: "brand.solid" },
    "::selection": { bg: "brand.subtle", color: "fg" },
    a: { textUnderlineOffset: "0.2em" },
  },
  theme: { tokens, semanticTokens, recipes, slotRecipes },
});

export const system = createSystem(defaultConfig, config);
