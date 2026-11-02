<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Agent skills

Vendored agent skills live in `.agents/skills/` (Claude Code reads them through the `.claude/skills` symlink). See `.agents/README.md` for each skill's source, commit and license. Use `vercel-react-best-practices` and `vercel-composition-patterns` when writing React/Next.js code, `supabase` and `supabase-postgres-best-practices` for anything touching Supabase or SQL migrations.
