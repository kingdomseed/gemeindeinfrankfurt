import { type MigrateUpArgs, type MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_announcements_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__announcements_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__announcements_v_published_locale" AS ENUM('de', 'en', 'ru');
  CREATE TABLE "payload"."pages_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."pages_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_statements_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"references" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_statements" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_meeting_place" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_announcements" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"limit" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."announcements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"show_until" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_announcements_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."announcements_locales" (
  	"title" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_announcements_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_show_until" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__announcements_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "payload"."enum__announcements_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."_announcements_v_locales" (
  	"version_title" varchar,
  	"version_body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "announcements_id" integer;
  ALTER TABLE "payload"."pages_blocks_text" ADD CONSTRAINT "pages_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_faq_items" ADD CONSTRAINT "pages_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_statements_items" ADD CONSTRAINT "pages_blocks_statements_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_statements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_statements" ADD CONSTRAINT "pages_blocks_statements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_meeting_place" ADD CONSTRAINT "pages_blocks_meeting_place_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_announcements" ADD CONSTRAINT "pages_blocks_announcements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."announcements_locales" ADD CONSTRAINT "announcements_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."announcements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_announcements_v" ADD CONSTRAINT "_announcements_v_parent_id_announcements_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."announcements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_announcements_v_locales" ADD CONSTRAINT "_announcements_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_announcements_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_text_order_idx" ON "payload"."pages_blocks_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_text_parent_id_idx" ON "payload"."pages_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_text_path_idx" ON "payload"."pages_blocks_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_text_locale_idx" ON "payload"."pages_blocks_text" USING btree ("_locale");
  CREATE INDEX "pages_blocks_faq_items_order_idx" ON "payload"."pages_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_items_parent_id_idx" ON "payload"."pages_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_items_locale_idx" ON "payload"."pages_blocks_faq_items" USING btree ("_locale");
  CREATE INDEX "pages_blocks_faq_order_idx" ON "payload"."pages_blocks_faq" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_parent_id_idx" ON "payload"."pages_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_path_idx" ON "payload"."pages_blocks_faq" USING btree ("_path");
  CREATE INDEX "pages_blocks_faq_locale_idx" ON "payload"."pages_blocks_faq" USING btree ("_locale");
  CREATE INDEX "pages_blocks_statements_items_order_idx" ON "payload"."pages_blocks_statements_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_statements_items_parent_id_idx" ON "payload"."pages_blocks_statements_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_statements_items_locale_idx" ON "payload"."pages_blocks_statements_items" USING btree ("_locale");
  CREATE INDEX "pages_blocks_statements_order_idx" ON "payload"."pages_blocks_statements" USING btree ("_order");
  CREATE INDEX "pages_blocks_statements_parent_id_idx" ON "payload"."pages_blocks_statements" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_statements_path_idx" ON "payload"."pages_blocks_statements" USING btree ("_path");
  CREATE INDEX "pages_blocks_statements_locale_idx" ON "payload"."pages_blocks_statements" USING btree ("_locale");
  CREATE INDEX "pages_blocks_meeting_place_order_idx" ON "payload"."pages_blocks_meeting_place" USING btree ("_order");
  CREATE INDEX "pages_blocks_meeting_place_parent_id_idx" ON "payload"."pages_blocks_meeting_place" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_meeting_place_path_idx" ON "payload"."pages_blocks_meeting_place" USING btree ("_path");
  CREATE INDEX "pages_blocks_meeting_place_locale_idx" ON "payload"."pages_blocks_meeting_place" USING btree ("_locale");
  CREATE INDEX "pages_blocks_announcements_order_idx" ON "payload"."pages_blocks_announcements" USING btree ("_order");
  CREATE INDEX "pages_blocks_announcements_parent_id_idx" ON "payload"."pages_blocks_announcements" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_announcements_path_idx" ON "payload"."pages_blocks_announcements" USING btree ("_path");
  CREATE INDEX "pages_blocks_announcements_locale_idx" ON "payload"."pages_blocks_announcements" USING btree ("_locale");
  CREATE INDEX "announcements_updated_at_idx" ON "payload"."announcements" USING btree ("updated_at");
  CREATE INDEX "announcements_created_at_idx" ON "payload"."announcements" USING btree ("created_at");
  CREATE INDEX "announcements__status_idx" ON "payload"."announcements" USING btree ("_status");
  CREATE UNIQUE INDEX "announcements_locales_locale_parent_id_unique" ON "payload"."announcements_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "announcements_locales_parent_id_idx" ON "payload"."announcements_locales" USING btree ("_parent_id");
  CREATE INDEX "_announcements_v_parent_idx" ON "payload"."_announcements_v" USING btree ("parent_id");
  CREATE INDEX "_announcements_v_version_version_updated_at_idx" ON "payload"."_announcements_v" USING btree ("version_updated_at");
  CREATE INDEX "_announcements_v_version_version_created_at_idx" ON "payload"."_announcements_v" USING btree ("version_created_at");
  CREATE INDEX "_announcements_v_version_version__status_idx" ON "payload"."_announcements_v" USING btree ("version__status");
  CREATE INDEX "_announcements_v_created_at_idx" ON "payload"."_announcements_v" USING btree ("created_at");
  CREATE INDEX "_announcements_v_updated_at_idx" ON "payload"."_announcements_v" USING btree ("updated_at");
  CREATE INDEX "_announcements_v_snapshot_idx" ON "payload"."_announcements_v" USING btree ("snapshot");
  CREATE INDEX "_announcements_v_published_locale_idx" ON "payload"."_announcements_v" USING btree ("published_locale");
  CREATE INDEX "_announcements_v_latest_idx" ON "payload"."_announcements_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_announcements_v_locales_locale_parent_id_unique" ON "payload"."_announcements_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_announcements_v_locales_parent_id_idx" ON "payload"."_announcements_v_locales" USING btree ("_parent_id");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_announcements_fk" FOREIGN KEY ("announcements_id") REFERENCES "payload"."announcements"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_announcements_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("announcements_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_announcements_fk";
  ALTER TABLE "payload"."pages_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."pages_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."pages_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."pages_blocks_statements_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."pages_blocks_statements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."pages_blocks_meeting_place" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."pages_blocks_announcements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."announcements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."announcements_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_announcements_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_announcements_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."pages_blocks_text" CASCADE;
  DROP TABLE "payload"."pages_blocks_faq_items" CASCADE;
  DROP TABLE "payload"."pages_blocks_faq" CASCADE;
  DROP TABLE "payload"."pages_blocks_statements_items" CASCADE;
  DROP TABLE "payload"."pages_blocks_statements" CASCADE;
  DROP TABLE "payload"."pages_blocks_meeting_place" CASCADE;
  DROP TABLE "payload"."pages_blocks_announcements" CASCADE;
  DROP TABLE "payload"."announcements" CASCADE;
  DROP TABLE "payload"."announcements_locales" CASCADE;
  DROP TABLE "payload"."_announcements_v" CASCADE;
  DROP TABLE "payload"."_announcements_v_locales" CASCADE;
  DROP INDEX "payload"."payload_locked_documents_rels_announcements_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "announcements_id";
  DROP TYPE "payload"."enum_announcements_status";
  DROP TYPE "payload"."enum__announcements_v_version_status";
  DROP TYPE "payload"."enum__announcements_v_published_locale";`);
}
