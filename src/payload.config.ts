import path from "node:path";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";

import { Pages } from "@/cms/collections/Pages";
import { Users } from "@/cms/collections/Users";
import { SiteSettings } from "@/cms/globals/SiteSettings";
import { migrations } from "@/cms/migrations";
import { locales } from "@/i18n/routing";

const localeLabels = { de: "Deutsch", en: "English", ru: "Русский" } as const;

export default buildConfig({
  admin: {
    user: Users.slug,
    // The import map is checked in and formatted; regenerate it with
    // `npm run cms:importmap` after adding admin components or editor features.
    importMap: {
      autoGenerate: false,
      importMapFile: path.resolve(process.cwd(), "src/app/(payload)/admin/importMap.ts"),
    },
  },
  collections: [Users, Pages],
  globals: [SiteSettings],
  editor: lexicalEditor({
    // No media or relationship collections exist, so their editor features have nothing to point at.
    features: ({ defaultFeatures }) =>
      defaultFeatures.filter(
        (feature) => feature.key !== "upload" && feature.key !== "relationship",
      ),
  }),
  localization: {
    locales: locales.map((code) => ({ code, label: localeLabels[code] })),
    defaultLocale: "de",
    fallback: true,
  },
  // Read lazily so `next build` works without a database. Payload refuses to
  // start without a secret, and the first query fails without a database URL.
  secret: process.env.PAYLOAD_SECRET ?? "",
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
    // Keeps Payload's tables out of `public`, where the training app's tables and RLS live.
    schemaName: "payload",
    migrationDir: path.resolve(process.cwd(), "src/cms/migrations"),
    // Production has no schema push; this brings its tables up to date on startup.
    prodMigrations: migrations,
  }),
  graphQL: { disable: true },
  typescript: { autoGenerate: false },
  telemetry: false,
});
