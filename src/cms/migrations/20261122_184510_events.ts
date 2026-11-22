import { type MigrateUpArgs, type MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__events_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__events_v_published_locale" AS ENUM('de', 'en', 'ru');
  CREATE TABLE "payload"."pages_blocks_upcoming_events" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"limit" numeric DEFAULT 4,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"import_key" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_events_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."events_locales" (
  	"title" varchar,
  	"location" varchar,
  	"details" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_import_key" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__events_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "payload"."enum__events_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."_events_v_locales" (
  	"version_title" varchar,
  	"version_location" varchar,
  	"version_details" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload"."users" ADD COLUMN "enable_a_p_i_key" boolean;
  ALTER TABLE "payload"."users" ADD COLUMN "api_key" varchar;
  ALTER TABLE "payload"."users" ADD COLUMN "api_key_index" varchar;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "events_id" integer;
  ALTER TABLE "payload"."pages_blocks_upcoming_events" ADD CONSTRAINT "pages_blocks_upcoming_events_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."events_locales" ADD CONSTRAINT "events_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_events_v_locales" ADD CONSTRAINT "_events_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_upcoming_events_order_idx" ON "payload"."pages_blocks_upcoming_events" USING btree ("_order");
  CREATE INDEX "pages_blocks_upcoming_events_parent_id_idx" ON "payload"."pages_blocks_upcoming_events" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_upcoming_events_path_idx" ON "payload"."pages_blocks_upcoming_events" USING btree ("_path");
  CREATE INDEX "pages_blocks_upcoming_events_locale_idx" ON "payload"."pages_blocks_upcoming_events" USING btree ("_locale");
  CREATE INDEX "events_starts_at_idx" ON "payload"."events" USING btree ("starts_at");
  CREATE INDEX "events_import_key_idx" ON "payload"."events" USING btree ("import_key");
  CREATE INDEX "events_updated_at_idx" ON "payload"."events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "payload"."events" USING btree ("created_at");
  CREATE INDEX "events__status_idx" ON "payload"."events" USING btree ("_status");
  CREATE UNIQUE INDEX "events_locales_locale_parent_id_unique" ON "payload"."events_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "events_locales_parent_id_idx" ON "payload"."events_locales" USING btree ("_parent_id");
  CREATE INDEX "_events_v_parent_idx" ON "payload"."_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_version_starts_at_idx" ON "payload"."_events_v" USING btree ("version_starts_at");
  CREATE INDEX "_events_v_version_version_import_key_idx" ON "payload"."_events_v" USING btree ("version_import_key");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "payload"."_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "payload"."_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_version_version__status_idx" ON "payload"."_events_v" USING btree ("version__status");
  CREATE INDEX "_events_v_created_at_idx" ON "payload"."_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "payload"."_events_v" USING btree ("updated_at");
  CREATE INDEX "_events_v_snapshot_idx" ON "payload"."_events_v" USING btree ("snapshot");
  CREATE INDEX "_events_v_published_locale_idx" ON "payload"."_events_v" USING btree ("published_locale");
  CREATE INDEX "_events_v_latest_idx" ON "payload"."_events_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_events_v_locales_locale_parent_id_unique" ON "payload"."_events_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_events_v_locales_parent_id_idx" ON "payload"."_events_v_locales" USING btree ("_parent_id");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "payload"."events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("events_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."pages_blocks_upcoming_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."events_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_events_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_events_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."pages_blocks_upcoming_events" CASCADE;
  DROP TABLE "payload"."events" CASCADE;
  DROP TABLE "payload"."events_locales" CASCADE;
  DROP TABLE "payload"."_events_v" CASCADE;
  DROP TABLE "payload"."_events_v_locales" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_events_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_events_id_idx";
  ALTER TABLE "payload"."users" DROP COLUMN "enable_a_p_i_key";
  ALTER TABLE "payload"."users" DROP COLUMN "api_key";
  ALTER TABLE "payload"."users" DROP COLUMN "api_key_index";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "events_id";
  DROP TYPE "payload"."enum_events_status";
  DROP TYPE "payload"."enum__events_v_version_status";
  DROP TYPE "payload"."enum__events_v_published_locale";`);
}
