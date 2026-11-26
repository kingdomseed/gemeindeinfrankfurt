-- Add coordinator roles ('admin', 'coordinator', 'helper') and per-role tab
-- visibility settings ('role_permissions').
-- Existing rows: coordinators with is_admin = true become role = 'admin', all
-- others become role = 'coordinator'; role_permissions starts with all 11 tabs
-- for 'coordinator' and ['messages'] for 'helper'.

alter table coordinators
  add column role text not null default 'coordinator'
  check (role in ('admin', 'coordinator', 'helper'));

update coordinators set role = 'admin' where is_admin;

-- Keep legacy is_admin and new role synchronized during rolling deploys and in
-- existing integration tests that insert/update is_admin directly.
create function sync_coordinator_role_admin() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.role = 'admin' or new.is_admin then
      new.role := 'admin';
      new.is_admin := true;
    else
      new.is_admin := false;
    end if;
    return new;
  end if;

  if new.role is distinct from old.role then
    new.is_admin := (new.role = 'admin');
  elsif new.is_admin is distinct from old.is_admin then
    new.role := case
      when new.is_admin then 'admin'
      when old.role = 'admin' then 'coordinator'
      else old.role
    end;
  end if;
  return new;
end;
$$;

create trigger coordinators_sync_role_admin
  before insert or update on coordinators
  for each row execute function sync_coordinator_role_admin();

create table role_permissions (
  role text primary key check (role in ('coordinator', 'helper')),
  tabs text[] not null check (
    tabs <@ array[
      'overview', 'registrations', 'outlines', 'groups', 'attendance',
      'messages', 'testing', 'services', 'emails', 'report', 'setup'
    ]::text[]
  ),
  updated_at timestamptz not null default now()
);

insert into role_permissions (role, tabs) values
  ('coordinator', array[
    'overview', 'registrations', 'outlines', 'groups', 'attendance',
    'messages', 'testing', 'services', 'emails', 'report', 'setup'
  ]),
  ('helper', array['messages'])
on conflict (role) do nothing;

alter table role_permissions enable row level security;

create policy "coordinators read role_permissions" on role_permissions
  for select to authenticated using ((select is_coordinator()));

revoke all on role_permissions from anon, authenticated;
grant select on role_permissions to authenticated;
grant select, insert, update, delete on role_permissions to service_role;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'role_permissions'
  ) then
    alter publication supabase_realtime add table role_permissions;
  end if;
end;
$$;
