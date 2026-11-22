-- Stage 2 coordination: standard services, coordinators serving in AV, the
-- Lebensstrom webcast login, and one study group per person and one test per
-- message.

-- Services ------------------------------------------------------------------
-- The nine standard services carry a kind, so their names and descriptions
-- come from the translations. A service a coordinator adds has only a name.
alter table services
  add column kind text check (kind in (
    'tech', 'rules', 'hymns', 'verses', 'questions', 'attendance', 'payments', 'name_tags', 'groups'
  )),
  add constraint services_training_kind_key unique (training_id, kind);

-- Existing rows: every training without services gets the nine standard ones.
-- Trainings that already have services are left as they are.
insert into services (training_id, kind, name, sort_order)
select t.id, k.kind, k.name, k.sort_order
from trainings t
cross join (values
  ('tech', 'Technik', 1), ('rules', 'Regeln', 2), ('hymns', 'Lieder', 3),
  ('verses', 'Versen', 4), ('questions', 'Fragen', 5), ('attendance', 'Anwesenheit', 6),
  ('payments', 'Zahlungen', 7), ('name_tags', 'Namensschilder', 8), ('groups', 'Gruppen', 9)
) as k (kind, name, sort_order)
where not exists (select 1 from services s where s.training_id = t.id);

-- AV coordinators -----------------------------------------------------------
-- Only coordinators serving in AV (Technik) see the webcast login. Existing
-- rows: today's admins serve in AV; everyone else does not until an admin
-- says so on the coordinators page.
alter table coordinators add column serves_av boolean not null default false;
update coordinators set serves_av = true where is_admin;

create function serves_av() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from coordinators where user_id = auth.uid() and serves_av);
$$;

-- Webcast login -------------------------------------------------------------
-- The login Lebensstrom sends for the LSM website. Never shown on the form,
-- in emails or in the WhatsApp group.
create table webcast_logins (
  training_id uuid primary key references trainings (id) on delete cascade,
  website text not null default '' check (char_length(website) <= 500),
  user_name text not null default '' check (char_length(user_name) <= 200),
  password text not null default '' check (char_length(password) <= 200),
  changed_by text not null default '',
  changed_at timestamptz not null default now()
);

-- Every time the password is shown.
create table webcast_login_views (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings (id) on delete cascade,
  viewer_id uuid default auth.uid() references auth.users (id) on delete set null,
  viewer_name text not null default '',
  viewed_at timestamptz not null default now()
);

create index webcast_login_views_training_idx
  on webcast_login_views (training_id, viewed_at desc);

alter table webcast_logins enable row level security;
alter table webcast_login_views enable row level security;

create policy "AV coordinators read the webcast login" on webcast_logins
  for select to authenticated using ((select serves_av()));
create policy "AV coordinators add the webcast login" on webcast_logins
  for insert to authenticated with check ((select serves_av()));
create policy "AV coordinators change the webcast login" on webcast_logins
  for update to authenticated using ((select serves_av())) with check ((select serves_av()));

create policy "coordinators read webcast_login_views" on webcast_login_views
  for select to authenticated using ((select is_coordinator()));
create policy "AV coordinators add webcast_login_views" on webcast_login_views
  for insert to authenticated with check ((select serves_av()));

grant select, insert, update, delete on webcast_logins, webcast_login_views
  to authenticated, service_role;

-- Study groups and testing --------------------------------------------------
-- Existing rows: none of these tables hold data yet.
alter table study_group_members
  add constraint study_group_members_registration_key unique (registration_id);
alter table test_slots add constraint test_slots_session_key unique (session_id);

create index study_groups_training_idx on study_groups (training_id, sort_order);
create index test_slots_group_idx on test_slots (group_id);

-- Replaces a training's study groups (and the tests planned for them) with
-- new ones in one transaction. p_groups is [{"language": "de", "members":
-- [registration ids]}, ...] in group order. Two coordinators pressing
-- "Suggest groups" at once wait for each other instead of mixing their groups.
create function replace_study_groups(p_training uuid, p_groups jsonb) returns void
language plpgsql security invoker set search_path = public as $$
declare
  g jsonb;
  n integer := 0;
  new_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('study_groups:' || p_training::text));
  delete from study_groups where training_id = p_training;
  for g in select * from jsonb_array_elements(p_groups) loop
    n := n + 1;
    insert into study_groups (training_id, name, language, sort_order)
    values (p_training, n::text, (g ->> 'language')::language_code, n)
    returning id into new_id;
    insert into study_group_members (group_id, registration_id)
    select new_id, m::uuid from jsonb_array_elements_text(g -> 'members') as m;
  end loop;
end;
$$;

-- Other coordinators' screens follow group, test and service changes live.
alter publication supabase_realtime add table study_groups, test_slots, services;

-- Copy last training now keeps the services' kinds -------------------------

create or replace function copy_training(p_source uuid, p_slug text, p_title jsonb, p_shift interval)
returns uuid language plpgsql security invoker as $$
declare
  new_id uuid;
begin
  insert into trainings (slug, title, fee_cents, outline_price_cents, payee_name,
                         payee_iban, payment_reference, venue, rules)
  select p_slug, p_title, fee_cents, outline_price_cents, payee_name,
         payee_iban, payment_reference, venue, rules
  from trainings where id = p_source
  returning id into new_id;

  insert into sessions (training_id, message_number, starts_at, ends_at, is_tested)
  select new_id, message_number, starts_at + p_shift, ends_at + p_shift, is_tested
  from sessions where training_id = p_source;

  insert into localities (training_id, name, is_home)
  select new_id, name, is_home from localities where training_id = p_source;

  insert into services (training_id, kind, name, sort_order)
  select new_id, kind, name, sort_order from services where training_id = p_source;

  return new_id;
end;
$$;

-- Service leads are people's names, so the purge clears them too.
create or replace function purge_personal_data(p_training uuid) returns void
language sql security invoker as $$
  update registrations set
    first_name = '-', last_name = '-',
    partner_first_name = case when seat_type = 'shared' then '-' end,
    partner_last_name = case when seat_type = 'shared' then '-' end,
    email = '-', phone = '', comments = '', waiver_reason = '', payer_name = '',
    fee_transaction = '', outline_transaction = '',
    edit_token_hash = encode(gen_random_bytes(32), 'hex')
  where training_id = p_training;
  update services set lead = '' where training_id = p_training;
$$;
