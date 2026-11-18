# Database (`supabase/`)

- Read `supabase-postgres-best-practices` before writing a migration, index, function or RLS policy, and `supabase` for CLI and auth questions.
- Never use Docker or suggest it: no `supabase start`, `db reset`, `db diff`, `db pull` or `--local`. Jason does not install Docker.
- Add a new timestamped file in `migrations/` for every change (`npm run db:new <name>`) and write the SQL by hand. Never edit a migration that has been merged.
- Merging to `main` applies new migrations to production (`.github/workflows/migrate.yml`). A migration must run on live data: say what it does to existing rows.
- Every new table enables RLS and gets explicit policies. Today the public may read published trainings, sessions and localities, coordinators read and write everything, and registrants reach their own row only through server actions that check the edit token.
- After a migration, run `npm run db:types` and commit the regenerated `src/lib/supabase/database.types.ts`. It needs a plain Postgres server (`SCRATCH_DB_URL`); CI checks the file. If a migration needs more of Supabase than `scratch/supabase-stub.sql` provides, add it there.
- Seed data uses made-up names and contacts only.
