<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Registration and coordination site for a church's local video training: Next.js App Router, Supabase, Chakra UI v3, next-intl (de, en, ru). Requirements are in `docs/business-requirements.md`.

## Skills: read before you write

Skills live in `.agents/skills/` (Claude Code also sees them through `.claude/skills`). Don't wait for a skill to trigger on its own. First look at the code you are changing, then open the matching `SKILL.md` below and follow it. Prefer what the skill and the docs in `node_modules` say over what you remember.

| When you…                                                            | Read                                                                              |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| build or change UI, a component, a page or the theme                 | `chakra-ui-builder`                                                               |
| review UI code, or move Tailwind or plain HTML to Chakra             | `chakra-ui-refactor`                                                              |
| write any React or Next.js code (data fetching, server/client, perf) | `vercel-react-best-practices`                                                     |
| design a component's props or split a component                      | `vercel-composition-patterns`, then `narrow-react-prop-types` once it has callers |
| touch Supabase: auth, clients, RLS, storage, CLI                     | `supabase`                                                                        |
| write SQL, a migration, an index or an RLS policy                    | `supabase-postgres-best-practices`                                                |
| finish any React change, or React Doctor reports something           | `react-doctor`                                                                    |
| critique, polish or harden a screen's design                         | `impeccable`                                                                      |
| check accessibility and UX against web interface guidelines          | `web-design-guidelines`                                                           |
| need to see the change running in a browser                          | `next-dev-loop` (drives `agent-browser`)                                          |
| are asked for a visual PR description                                | `visual-pr` (only when asked by name)                                             |

Sources and versions are in `.agents/README.md`. Never edit a vendored skill; put project rules in these AGENTS.md files.

## Architecture

Code is split into layers. Each layer imports only from the layers below it, and Oxlint (`no-restricted-imports` in `.oxlintrc.json`) rejects imports that break this.

| Layer          | Folder                     | Holds                                                                      |
| -------------- | -------------------------- | -------------------------------------------------------------------------- |
| Routes         | `src/app/`                 | Thin pages and layouts, plus `actions.ts` server actions next to the route |
| Features       | `src/features/<feature>/`  | Screens' building blocks for one feature (registration, coordinator, …)    |
| UI             | `src/components/ui/`       | Generic Chakra pieces with no app knowledge                                |
| Theme          | `src/theme/`               | Chakra `createSystem`, tokens, semantic tokens, recipes                    |
| Data access    | `src/lib/` (not `domain/`) | Server-only Supabase queries, auth, email, small helpers                   |
| Business rules | `src/lib/domain/`          | Pure functions with tests                                                  |

Each of these folders has its own `AGENTS.md` with the rules for that layer; read it before editing there. Import across layers with the `@/` alias, never with `../` paths, so the boundary rules can see the import.

## Definition of done

A change is done when `npm run check` passes (format, type check, lint, tests, React Doctor) and `npm run build` succeeds. CI runs the same steps. In Claude Code, hooks in `.claude/settings.json` format and lint every file you edit and run the checks before you stop. Read the error and fix the cause.

## Guardrails

These are enforced by `tsconfig.json`, `.oxlintrc.json`, React Doctor and tests. Do not weaken them to get a change through:

- Never add `any`, narrowing `as` casts, non-null assertions (`!`), `@ts-ignore`, or `oxlint-disable` comments. Narrow unknown values with a type guard or parse them with zod. A disable comment needs a `-- reason` and a rule that is genuinely wrong for that line.
- Never loosen `tsconfig.json` or `.oxlintrc.json`, skip or delete tests, or weaken an assertion. If a rule seems wrong, say so in the PR.
- React Doctor must report nothing. Treat a finding as a hypothesis: read the code, fix the cause. Suppress only a confirmed false positive with `// react-doctor-disable-next-line <rule> -- reason`.
- Await every promise, or mark a deliberate fire-and-forget with `void`.
- Validate everything that crosses a trust boundary with zod: form data, route params, search params, jsonb columns, third-party responses.
- User-facing text goes in `messages/{de,en,ru}.json`, with the same keys in all three files.
- Never put real participant names, emails or phone numbers in code, tests, seeds, commits or PRs.
- Keep changes small and on topic. Before finishing, re-read your diff and remove dead code, debug output and comments that only narrate the code.

## Commands

| Command             | What it does                                                      |
| ------------------- | ----------------------------------------------------------------- |
| `npm run check`     | Format check, type check, type-aware lint, tests and React Doctor |
| `npm run format`    | Format with Oxfmt                                                 |
| `npm run lint:fix`  | Apply Oxlint's safe fixes                                         |
| `npm run typecheck` | Generate Next.js route types, then `tsc --noEmit`                 |
| `npm test`          | Vitest unit tests                                                 |
| `npm run doctor`    | React Doctor scan, plus a dependency supply-chain check           |
| `npm run db:types`  | Regenerate Supabase types from the local database                 |
