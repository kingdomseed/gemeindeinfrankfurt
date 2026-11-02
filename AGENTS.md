<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Agent skills

Vendored agent skills live in `.agents/skills/` (Claude Code reads them through the `.claude/skills` symlink). See `.agents/README.md` for each skill's source, commit and license. Use `vercel-react-best-practices` and `vercel-composition-patterns` when writing React/Next.js code, `supabase` and `supabase-postgres-best-practices` for anything touching Supabase or SQL migrations.

## Definition of done

A change is done when `npm run check` passes (format, type check, lint, tests, React Doctor) and `npm run build` succeeds. CI runs the same steps; in Claude Code, hooks in `.claude/settings.json` format and lint every file you edit and run the checks before you stop. Read the error and fix the cause.

## Guardrails

These are enforced by `tsconfig.json`, `.oxlintrc.json` and tests, not just asked for here. Do not weaken them to get a change through:

- Never add `any`, `as` casts that narrow a type, non-null assertions (`!`), `@ts-ignore`, or `oxlint-disable` comments. If a value's type is not known, narrow it with a type guard or parse it with zod. A disable comment is only acceptable with a `-- reason` and when the rule is genuinely wrong for that line.
- Never loosen `tsconfig.json` or `.oxlintrc.json`, delete or skip tests, or lower an assertion to make a check pass. If a rule seems wrong, say so in the PR instead.
- Await every promise, or mark a deliberate fire-and-forget with `void`.
- Validate everything that crosses a trust boundary with zod: form data, route params, URL search params, jsonb columns, and third-party responses.
- Database access goes through the typed Supabase clients in `src/lib/supabase/`. After any migration, regenerate `src/lib/supabase/database.types.ts` with `npm run db:types` instead of editing it by hand.
- Text shown to users goes in `messages/{de,en,ru}.json` with the same keys in all three files (a test checks this). Message keys are typed, so a missing key fails the type check.
- Business rules (fees, cutoffs, outline counts) live in `src/lib/domain/` as pure functions with tests. Add or update a test with every rule change.
- Never put real participant names, emails or phone numbers in code, tests, seeds, commits or PRs.
- React Doctor (`npm run doctor`, and the `react-doctor` skill) must report no issues. Treat a finding as a hypothesis: read the code, then fix the cause. Suppress only a confirmed false positive, with `// react-doctor-disable-next-line <rule> -- reason`.
- Every exported server action that changes coordinator data starts with `requireAuth()` from `src/lib/auth.ts`. Registrant actions check the edit token with `findByToken` first.
- Keep changes small and on topic. Before finishing, re-read your diff and remove dead code, debugging output and comments that only narrate the code.

## Commands

| Command             | What it does                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `npm run check`     | Format check, type check, type-aware lint and tests                                                                 |
| `npm run format`    | Format with Oxfmt                                                                                                   |
| `npm run lint:fix`  | Apply Oxlint's safe fixes                                                                                           |
| `npm run typecheck` | Generate Next.js route types, then `tsc --noEmit`                                                                   |
| `npm test`          | Vitest unit tests                                                                                                   |
| `npm run doctor`    | React Doctor: React correctness, security, performance and accessibility scan, plus a dependency supply-chain check |
| `npm run db:types`  | Regenerate Supabase types from the local database                                                                   |
