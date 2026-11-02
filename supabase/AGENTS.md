# Database (`supabase/`)

- Read `supabase-postgres-best-practices` before writing a migration, index, function or RLS policy, and `supabase` for CLI and auth questions.
- Add a new timestamped file in `migrations/` for every change. Never edit a migration that has been merged.
- Every new table enables RLS and gets explicit policies. Today the public may read published trainings, sessions and localities, coordinators read and write everything, and registrants reach their own row only through server actions that check the edit token.
- After a migration, run `npm run db:types` and commit the regenerated `src/lib/supabase/database.types.ts`.
- Seed data uses made-up names and contacts only.
