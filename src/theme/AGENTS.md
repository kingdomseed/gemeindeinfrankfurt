# Theme (`src/theme/`)

The Chakra `createSystem` config: tokens, semantic tokens (light and dark), text styles, recipes and slot recipes. This is the only place colours, fonts, radii and spacing scales are defined.

- Read `chakra-ui-builder` (theming sections) before changing anything here.
- Components refer to semantic tokens (`fg.muted`, `bg.panel`, the brand palette), never to raw values. Add a token here rather than a one-off value in a component.
- Imports only from `@chakra-ui/react`. Nothing from the app (lint enforces this).
- Check colour contrast in light and dark mode when you change a colour token.
