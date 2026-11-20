# die Gemeinde in Frankfurt

The website of the church in Frankfurt (gemeindeinfrankfurt.de): its public
pages, edited in Payload CMS at `/admin`, and under `/[locale]/training` the
registration and coordination site for its showing of the semiannual video
training. The pages' wording comes from the old WordPress site, recovered in
[archive/wordpress-2022](archive/wordpress-2022/README.md).

The training site replaces the Google Forms and spreadsheets we used before:

- **Registrants** sign up, see the schedule and what to pay, and change or cancel
  their registration through a personal link in their confirmation email. No
  account needed.
- **Coordinators** sign in and share one live view: registrations, payment
  checkboxes, outline counts, and later study groups, attendance, hymns, verses,
  services and the report to Lebensstrom e.V.

The site and its emails are in **German, English and Russian**.

The full scope, rules and decisions are in
[docs/business-requirements.md](docs/business-requirements.md).

## Status

This is the initial scaffold. Work is staged around the January 2027 training:

| Stage                  | Ready by                        | Scope                                                                                                                          | State       |
| ---------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| 1. Registration        | ~20 Nov 2026                    | Form in 3 languages, confirmation email with edit link, edit and cancel, registration list, payment checkboxes, outline counts | Scaffolded  |
| 2. During the training | 1 week before the first session | Study groups, phone attendance, hymns/verses/rules on screen, services, testing schedule, name tags, reminders                 | Schema only |
| 3. After the training  | Last session                    | Report page, printable questionnaire, reimbursements                                                                           | Schema only |

Before stage 1 goes live, still to do:

- Datenschutzerklärung and Impressum pages, linked from the form
- Cloudflare Turnstile and rate limiting on the public form
- A coordinator screen to edit the training (dates, fees, rules, IBAN) and to
  add, change or cancel registrations on someone's behalf
- Pre-registration, payment reminder and broadcast emails
- Real dates, IBAN and reference in place of the seed placeholders

## Stack

- [Next.js 16](https://nextjs.org) (App Router). Note that Next 16 renamed
  `middleware.ts` to `proxy.ts`; see `src/proxy.ts`.
- [Supabase](https://supabase.com) for Postgres, coordinator auth (email links)
  and Realtime. Host the project in the EU (Frankfurt) region.
- [Chakra UI v3](https://chakra-ui.com) for every UI component, themed in
  `src/theme/` (light and dark mode follow the device through `next-themes`).
- [next-intl](https://next-intl.dev) for translations (`messages/*.json`).
- [Resend](https://resend.com) for email.
- [Vitest](https://vitest.dev) for unit tests.
- [Oxlint](https://oxc.rs/docs/guide/usage/linter) (type-aware) and
  [Oxfmt](https://oxc.rs/docs/guide/usage/formatter) for linting and formatting,
  [React Doctor](https://github.com/millionco/react-doctor) for React-specific
  checks, [Lefthook](https://lefthook.dev) for git hooks.

## How it fits together

```
messages/{de,en,ru}.json     all UI and email text
src/proxy.ts                 locale routing + coordinator session refresh (not /admin or /api)
src/app/[locale]/            thin routes: church home, /[slug] (CMS pages), /privacy
src/app/[locale]/training/   training home, /register, /r/[token] (edit link), /coordinator
src/app/(payload)/           Payload admin (/admin) and REST API (/api), set up as in Payload's template
src/payload.config.ts        Payload config: locales, Postgres schema "payload"
src/cms/                     Payload collections and globals, and the content seed
src/lib/cms.ts               CMS page and site-settings queries
src/features/<feature>/      screens built from UI pieces: shell, church, home, registration, coordinator, privacy
src/components/ui/           generic Chakra building blocks (field, choice, notice, provider)
src/theme/                   Chakra system: colour tokens, dark mode, recipe defaults
src/lib/coordinator.ts       coordinator page queries
src/lib/domain/              pure rules: fees, cutoffs, outline counts, payments, session labels, tokens (tested)
src/lib/registrations.ts     form validation and registration storage
src/lib/email/send.ts        confirmation and cancellation emails
supabase/migrations/         schema, row-level security, copy_training, purge_personal_data
supabase/seed.sql            sample training for a development project (no personal data)
```

**Security model.** Registrants never talk to the database directly. Their edit
link carries a random 256-bit token; the database stores only its SHA-256 hash,
and server code checks it before using the service-role key. Coordinators sign in
with Supabase Auth and must be listed in the `coordinators` table; row-level
security gives them full access and gives anonymous users read access only to
published trainings and their schedule.

**Rules from Lebensstrom** (December 2026 page) built into `src/lib/domain`:
one fee per seat (a shared seat pays once), no fee for Anaheim attendees or
Ukrainian saints who are not gainfully employed, outlines billed separately;
seat type, sessions and cancelling lock when the first session starts; new
registrations close at the end of the first local day (Europe/Berlin).

## Getting started

Requirements: Node 22.18 or later. Docker is not used: there is no local
Supabase stack. Develop against a hosted Supabase project, ideally a separate
development project rather than production.

```bash
npm install
cp .env.example .env.local  # the project's URL, keys and database URL; set PAYLOAD_SECRET
npx supabase db push --remote="<dev database URL>" --include-seed  # migrations and seed.sql
npm run seed:cms            # loads the church pages into Payload
npm run dev                 # http://localhost:3000
```

Only push the seed to a development project, never to production. To become a
coordinator, add a user under Authentication in the Supabase dashboard and a row
for it in the SQL editor:

```sql
insert into coordinators (user_id, display_name, is_admin)
values ('<auth user id>', 'Your name', true);
```

Then sign in at `/de/training/coordinator/login`.

To edit the church pages, open http://localhost:3000/admin and create the first
CMS user there. CMS users are separate from coordinators.

### Checks

```bash
npm run check    # format check, type check, lint, tests, React Doctor
npm run build
npm run format   # rewrite files with Oxfmt
npm run lint:fix # apply Oxlint's safe fixes
```

CI runs all of these on every push and pull request, and `npm install` sets up
git hooks that format and lint staged files on commit and run `npm run check`
before a push.

### Database migrations

Schema changes are SQL files in `supabase/migrations/`, and none of this needs
Docker.

1. `npm run db:new <name>` creates an empty, timestamped migration. Write the
   SQL by hand (`supabase db diff` and `db pull` need Docker, so we don't use them).
2. `npm run db:types` regenerates `src/lib/supabase/database.types.ts`. It
   applies the migrations to a throwaway database on any plain Postgres server
   (`SCRATCH_DB_URL`, default `postgres:postgres@127.0.0.1:5432`). Without one,
   push the branch: CI does the same on the runner's Postgres and fails with the
   expected diff when the committed file is out of date.
3. After the pull request merges, the
   [Migrate database](.github/workflows/migrate.yml) workflow runs
   `supabase db push` against production and applies only the new files.

The workflow needs one secret, `SUPABASE_DB_URL`, in the `production`
environment (Settings, Environments, production): the database connection
string from the Supabase dashboard's Connect panel. Use the session pooler URL,
because GitHub's runners have no IPv6 for the direct connection. Without the
secret the workflow only warns. It can also be run by hand from the Actions tab.

The rules that keep people and coding agents from shipping mistakes, and the
reasons behind them, are in [AGENTS.md](AGENTS.md).

## Personal data

Never put real participant names, emails or phone numbers in code, seeds, tests
or issues. Use made-up placeholders. After the Lebensstrom report is accepted,
run `select purge_personal_data('<training id>');` to remove names and contact
details while keeping the counts.

## License

[MIT](LICENSE)
