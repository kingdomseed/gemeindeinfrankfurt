# Shared UI (`src/components/ui/`)

Generic Chakra UI v3 building blocks (field, button, card, the Chakra `Provider`) that know nothing about this app. Chakra CLI snippets (`npx @chakra-ui/cli snippet add`) land here too.

- Before writing or changing a component, read `chakra-ui-builder`. To review one or convert existing markup, read `chakra-ui-refactor`.
- Style with Chakra props, recipes and tokens from `src/theme/`. Don't add Tailwind classes, inline `style`, or raw colour and spacing values.
- Everything arrives through props, including translated text and callbacks. Files in `ui/` may import Chakra, React and `@/theme`, nothing else from the app (lint enforces this: no next-intl, `@/lib`, `@/i18n`, `@/features` or `@/app`).
- Prefer composition (children, compound components) over boolean props. See `vercel-composition-patterns`.
- Only `ui/` lives here. Anything that knows about registrations, payments or coordinators belongs in `src/features/`.
