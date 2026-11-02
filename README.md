# Video Training Platform

Registration and coordination for a local church's showing of the semiannual
video training. It replaces the Google Forms and spreadsheets we used before:

- **Registrants** sign up, see the schedule and what to pay, and change or cancel
  their registration through a personal link in their confirmation email. No
  account needed.
- **Coordinators** sign in and share one live view: registrations, payment
  checkboxes, outline counts, and later study groups, attendance, hymns, verses,
  services and the report to Lebensstrom e.V.

The site and its emails are in **German, English and Russian**.

## Status

This is the initial scaffold. Work is staged around the January 2027 training:

| Stage | Ready by | Scope | State |
| --- | --- | --- | --- |
| 1. Registration | ~20 Nov 2026 | Form in 3 languages, confirmation email with edit link, edit and cancel, registration list, payment checkboxes, outline counts | Scaffolded |
| 2. During the training | 1 week before the first session | Study groups, phone attendance, hymns/verses/rules on screen, services, testing schedule, name tags, reminders | Schema only |
| 3. After the training | Last session | Report page, printable questionnaire, reimbursements | Schema only |

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
- [next-intl](https://next-intl.dev) for translations (`messages/*.json`).
- [Resend](https://resend.com) for email.
- [Vitest](https://vitest.dev) for unit tests.

## How it fits together

```
messages/{de,en,ru}.json     all UI and email text
src/proxy.ts                 locale routing + coordinator session refresh
src/app/[locale]/            public pages: home, /register, /r/[token] (edit link)
src/app/[locale]/coordinator coordinator dashboard and sign-in
src/lib/domain/              pure rules: fees, cutoffs, outline counts, tokens (tested)
src/lib/registrations.ts     form validation and registration storage
src/lib/email/send.ts        confirmation and cancellation emails
supabase/migrations/         schema, row-level security, copy_training, purge_personal_data
supabase/seed.sql            local sample training (no personal data)
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

Requirements: Node 22, Docker (for local Supabase).

```bash
npm install
npx supabase start          # local Postgres, Auth, Realtime, and the Inbucket mail viewer
npx supabase db reset       # applies migrations and seed.sql
cp .env.example .env.local  # paste the URL and keys printed by `supabase start`
npm run dev                 # http://localhost:3000
```

To become a coordinator locally, sign up a user in Supabase Studio
(http://127.0.0.1:54323) and add a row for it:

```sql
insert into coordinators (user_id, display_name, is_admin)
values ('<auth user id>', 'Your name', true);
```

Then sign in at `/de/coordinator/login`.

### Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

CI runs the same four on every push and pull request.

## Personal data

Never put real participant names, emails or phone numbers in code, seeds, tests
or issues. Use made-up placeholders. After the Lebensstrom report is accepted,
run `select purge_personal_data('<training id>');` to remove names and contact
details while keeping the counts.

## License

[MIT](LICENSE)
