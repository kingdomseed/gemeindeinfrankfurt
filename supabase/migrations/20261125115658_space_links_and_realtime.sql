-- Shared external links (Google Docs, Sheets, Slides, URLs) per coordinator
-- space, plus full Realtime publication coverage across coordinator tables.
-- Existing rows: no existing rows are changed; training_links starts empty.

create table training_links (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings (id) on delete cascade,
  section text not null check (
    section in (
      'overview', 'registrations', 'outlines', 'groups', 'attendance',
      'messages', 'testing', 'services', 'emails', 'report', 'setup'
    )
  ),
  title text not null check (char_length(trim(title)) between 1 and 120),
  url text not null check (char_length(url) <= 2000 and url ~ '^https://'),
  added_by text not null default '',
  created_at timestamptz not null default now()
);

create index training_links_training_section_idx
  on training_links (training_id, section, created_at);

alter table training_links enable row level security;

create policy "coordinators read training_links" on training_links
  for select to authenticated using ((select is_coordinator()));
create policy "coordinators add training_links" on training_links
  for insert to authenticated with check ((select is_coordinator()));
create policy "coordinators remove training_links" on training_links
  for delete to authenticated using ((select is_coordinator()));

grant select, insert, delete on training_links to authenticated, service_role;

-- Every remaining coordinator table joins Realtime so all open screens stay
-- in step without page-level locks.
do $$
declare
  t text;
begin
  foreach t in array array[
    'training_links', 'outline_orders', 'trainings', 'sessions',
    'localities', 'email_sends', 'coordinators', 'webcast_logins'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end;
$$;
