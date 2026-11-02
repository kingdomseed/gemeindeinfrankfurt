# Routes (`src/app/`)

Route files stay thin. A `page.tsx` or `layout.tsx` reads params, loads data through `src/lib/`, and renders feature components. Layout and styling live in features and `src/components/ui/`, not here.

- Before writing a page, layout, route handler or server action, read `vercel-react-best-practices`. Check `node_modules/next/dist/docs/` for any Next.js API you use.
- Server actions go in `actions.ts` next to the route that uses them. Each one parses its input with zod, then checks access: coordinator actions start with `requireAuth()` from `src/lib/auth.ts`, registrant actions check the edit token with `findByToken` first. Then it calls `src/lib/` for data and `src/lib/domain/` for rules.
- Pass server actions to feature components as props. Features never import from `src/app/`.
- Every page calls `setRequestLocale` and gets text from `getTranslations`. No hard-coded user-facing strings.
