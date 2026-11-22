import { type MigrateUpArgs, type MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."announcements" ADD COLUMN "import_key" varchar;
  ALTER TABLE "payload"."_announcements_v" ADD COLUMN "version_import_key" varchar;
  CREATE INDEX "announcements_import_key_idx" ON "payload"."announcements" USING btree ("import_key");
  CREATE INDEX "_announcements_v_version_version_import_key_idx" ON "payload"."_announcements_v" USING btree ("version_import_key");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "payload"."announcements_import_key_idx";
  DROP INDEX "payload"."_announcements_v_version_version_import_key_idx";
  ALTER TABLE "payload"."announcements" DROP COLUMN "import_key";
  ALTER TABLE "payload"."_announcements_v" DROP COLUMN "version_import_key";`);
}
