-- The parts of a Supabase database that our migrations rely on, for a plain
-- Postgres scratch database (scripts/db-types.sh). Hosted Supabase already has
-- them, so this file is never pushed there.

-- Roles belong to the whole server, so a second run finds them already there.
do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
  end if;
end
$$;

create schema auth;
create schema extensions;

-- Supabase installs extensions in their own schema and puts it on the search
-- path, so they stay out of the generated types (whose content would otherwise
-- depend on the server's pgcrypto version).
create extension if not exists pgcrypto with schema extensions;
do $$
begin
  execute format('alter database %I set search_path = public, extensions', current_database());
end
$$;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

create function auth.uid() returns uuid
  language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create function auth.jwt() returns jsonb
  language sql stable
  as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;

create publication supabase_realtime;

-- Storage keeps its buckets in a table of its own schema.
create schema storage;
create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
