# Features (`src/features/<feature>/`)

One folder per feature, such as `registration`, `coordinator`, `receipt` and `shell` (site header and language switcher). A feature composes `src/components/ui/` pieces into the parts of a screen.

- Before writing a component here, read `chakra-ui-builder` and `vercel-composition-patterns`. Run `react-doctor` when you finish.
- Use Chakra components and theme tokens. Don't add Tailwind classes, inline `style`, or raw colour and spacing values.
- May import: `@/components/ui`, `@/lib/domain`, `@/i18n/navigation`, next-intl, and types (`import type`) from `src/lib/`.
- Must not import: `@/app/**`, Supabase, or runtime code from `src/lib/` data modules (lint enforces this). The one exception is `@/lib/supabase/browser` for login and realtime. The route loads data and passes it in, with server actions as props.
- Keep files small: one component per file, named after the component. Mark a file `"use client"` only when it needs state, effects or event handlers, and keep that boundary as low in the tree as you can.
- Text comes from `useTranslations` / `getTranslations`, with keys in all three `messages/*.json` files.
