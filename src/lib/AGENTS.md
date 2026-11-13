# Data access and business rules (`src/lib/`)

## Data access (`supabase/`, `data.ts`, `registrations.ts`, `auth.ts`, `email/`, `cms.ts`)

Server-side modules (`data.ts`, `registrations.ts`, `auth.ts`, `email/`, `cms.ts`, `supabase/server.ts`, `supabase/admin.ts`) start with `import "server-only"`. `cms.ts` reads Payload through its Local API and parses what it returns. The exceptions run in the browser or the proxy and must never import `server-only`: `supabase/browser.ts` (the `"use client"` client for login and realtime), `supabase/proxy.ts`, and their shared `supabase/env.ts` and `database.types.ts`.

- Read `supabase` before changing clients, auth or queries, and `supabase-postgres-best-practices` before changing what a query asks of the database.
- Use the typed clients in `src/lib/supabase/`. Never edit `database.types.ts` by hand: after a migration run `npm run db:types`.
- Parse rows that carry jsonb or other loose data with zod before returning them.
- Return plain typed data. Features and UI never import these modules at runtime, except that features may use `supabase/browser.ts` for login and realtime (lint enforces this), so export the types they need with `export type`.

## Business rules (`domain/`)

Fees, cutoffs, outline counts and tokens as pure functions.

- No React, Next.js, next-intl, Supabase or imports from other `src/` folders (lint enforces this). Take data as arguments and return values.
- Every rule has a test in `domain.test.ts`. Add or update a test with every rule change.
- Shared types that features need (`Language`, `SeatType`, …) live in `domain/types.ts`.
