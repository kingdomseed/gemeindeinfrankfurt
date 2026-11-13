# CMS schema and seed (`src/cms/`, `src/payload.config.ts`)

Payload CMS 3 holds the church's public pages and site settings. Its admin is at `/admin`; its tables live in the `payload` schema of the same Postgres, away from the training app's `public` schema and RLS.

- `collections/` and `globals/` define the content: `pages` (localized title, slug and rich text, menu order, home flag), `site-settings` (site name, tagline, contact panel, meeting address, optional contact email) and `users` (CMS editors, separate from the coordinators' Supabase Auth).
- Read Payload's docs for any API you use (https://payloadcms.com/docs). Locales come from `src/i18n/routing.ts`; German is the default and fills in for missing translations.
- May import Payload packages, `@/i18n/routing` and `@/lib/domain`, nothing else from the app (lint enforces this). Routes read content through `src/lib/cms.ts`, never from here.
- `seed/` loads the pages from `archive/wordpress-2022/content` word for word, and Russian from `seed/ru/`. Keep the recovered wording as it is, typos included. `npm run seed:cms` updates the same pages when run again.
- After adding an editor feature or admin component, run `npm run cms:importmap` and commit `src/app/(payload)/admin/importMap.ts`.
- Payload creates its tables itself in development. Before the first deployment, create migrations with `npx payload migrate:create`.
