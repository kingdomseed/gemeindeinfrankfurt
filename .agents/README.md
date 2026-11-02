# Agent skills

Skills in `.agents/skills/` guide coding agents (Claude Code, Codex, Copilot,
Cursor and others that read the [Agent Skills](https://agentskills.io) format)
when they work on this repository. Claude Code reads them through the
`.claude/skills` symlink.

Each skill is copied unchanged from its published source at the commit listed
below. To update a skill, copy the folder again from its source and update the
commit here. Do not edit vendored files in place; add project rules to
`AGENTS.md` instead.

| Skill | What it is for | Source | Commit | License |
| --- | --- | --- | --- | --- |
| `vercel-react-best-practices` | React and Next.js performance rules (waterfalls, bundle size, server work, re-renders) | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) | `1a2c79d` | MIT (declared in the repo README and the skill's frontmatter) |
| `vercel-composition-patterns` | Component API design: compound components, no boolean-prop sprawl, React 19 APIs | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns) | `1a2c79d` | MIT (as above) |
| `web-design-guidelines` | UI, accessibility and UX review against Vercel's Web Interface Guidelines (fetched live) | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) | `1a2c79d` | MIT (repo README) |
| `next-dev-loop` | Verify changes in a running `next dev` through `/_next/mcp` and `agent-browser` (needs Next.js 16.3+ with Turbopack) | [vercel/next.js](https://github.com/vercel/next.js/tree/canary/skills/next-dev-loop) | `2480764` | MIT, `next-dev-loop/LICENSE.md` |
| `agent-browser` | Discovery stub for Vercel's `agent-browser` CLI, which `next-dev-loop` drives (`npm i -g agent-browser && agent-browser install`) | [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser/tree/main/skills/agent-browser) | `5868f7c` | Apache-2.0, `agent-browser/LICENSE` |
| `narrow-react-prop-types` | Narrow React prop types to what live call sites actually pass | [humanlayer/skills](https://github.com/humanlayer/skills/tree/main/plugins/narrow-react-prop-types) | `4d69d20` | MIT, `narrow-react-prop-types/LICENSE` |
| `visual-pr` | Write a PR description with a compact visual outline (runs only when invoked by name) | [humanlayer/skills](https://github.com/humanlayer/skills/tree/main/plugins/visual-pr) | `4d69d20` | MIT, `visual-pr/LICENSE` |
| `supabase` | Supabase Auth, RLS, SSR, CLI, migrations and security checklist | [supabase/agent-skills](https://github.com/supabase/agent-skills/tree/main/skills/supabase) | `c9be0e9` | MIT, `supabase/LICENSE` |
| `react-doctor` | Run React Doctor after React changes and triage its findings | [react-doctor](https://www.npmjs.com/package/react-doctor) npm package, `dist/skills/react-doctor`, installed with `npx react-doctor install` | `0.9.22` (skill v1.2.0) | Modified MIT, `react-doctor/LICENSE`: free to use and redistribute, but using it as AI training data or selling it as a hosted service needs Million's permission |
| `supabase-postgres-best-practices` | Postgres schema, index, RLS and query rules | [supabase/agent-skills](https://github.com/supabase/agent-skills/tree/main/skills/supabase-postgres-best-practices) | `c9be0e9` | MIT, `supabase-postgres-best-practices/LICENSE` |

## Notes for this repo

- Some skills were written for their authors' own repos. `narrow-react-prop-types`
  shows `bun` typecheck commands and a sample CI workflow in `references/`; here,
  use `npx tsc --noEmit` and `npm run lint` instead. `visual-pr` saves drafts under
  `.humanlayer/tasks/`, which is fine to leave uncommitted.
- Skills considered and left out: `typescript-project-setup` from
  [microsoft/typescript-skills](https://github.com/microsoft/typescript-skills)
  (the TypeScript team's only published skill so far) covers creating a new
  TypeScript project, and its `rootDir`/`outDir` advice conflicts with a Next.js
  app that is already set up.
