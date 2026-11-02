-- Video training platform: initial schema.
-- Registrants never talk to the database directly. The public form and the
-- per-registration edit link go through server code that uses the service role
-- after checking the edit token. Coordinators sign in with Supabase Auth and
-- are governed by the row-level security policies below.

create extension if not exists pgcrypto;

create type language_code as enum ('de', 'en', 'ru');
create type seat_type as enum ('full_time', 'part_time', 'shared');
create type registration_status as enum ('active', 'cancelled');
create type fee_waiver as enum ('anaheim', 'ukraine_not_employed', 'hardship');
create type attendance_mark as enum ('present', 'absent', 'excused', 'not_registered');

-- Coordinators -------------------------------------------------------------

create table coordinators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create function is_coordinator() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from coordinators where user_id = auth.uid());
$$;

-- Trainings and schedule ---------------------------------------------------

create table trainings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title jsonb not null,                        -- {"de": "...", "en": "...", "ru": "..."}
  is_published boolean not null default false, -- shown on the public form
  fee_cents integer not null check (fee_cents >= 0),
  outline_price_cents integer not null check (outline_price_cents >= 0),
  payee_name text not null default '',
  payee_iban text not null default '',
  payment_reference text not null default '',
  venue text not null default '',
  rules jsonb not null default '{}'::jsonb,    -- per-language markdown shown on the form
  outline_order_deadline timestamptz,
  report_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per message. Session names in every language are formatted from
-- starts_at, so the German, English and Russian labels can never disagree.
create table sessions (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings (id) on delete cascade,
  message_number integer not null check (message_number > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_tested boolean not null default true,
  unique (training_id, message_number),
  check (ends_at > starts_at)
);

create table localities (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings (id) on delete cascade,
  name text not null,
  is_home boolean not null default false,
  unique (training_id, name)
);

-- Registrations ------------------------------------------------------------

create table registrations (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings (id) on delete cascade,
  locality_id uuid references localities (id) on delete set null,
  status registration_status not null default 'active',
  seat_type seat_type not null,
  first_name text not null,
  last_name text not null,
  partner_first_name text,                     -- shared seat only
  partner_last_name text,
  email text not null,
  phone text not null default '',
  locale language_code not null,               -- language for emails
  group_language language_code not null,
  outline_language language_code not null,
  second_outline_language language_code,
  comments text not null default '',
  confirmed_adult boolean not null check (confirmed_adult),
  accepted_rules boolean not null check (accepted_rules),
  attended_anaheim boolean not null default false,
  ukraine_not_employed boolean not null default false,
  waiver fee_waiver,
  waiver_reason text not null default '',
  fee_paid boolean not null default false,
  outline_paid boolean not null default false,
  edit_token_hash text not null unique,        -- sha256 of the token in the email link
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (seat_type <> 'shared' or (partner_first_name is not null and partner_last_name is not null)),
  check (second_outline_language is null or second_outline_language <> outline_language)
);

create index registrations_training_idx on registrations (training_id, status);
create index registrations_email_idx on registrations (training_id, lower(email));

-- Sessions a part-timer chose. Full-time and shared seats have no rows here:
-- they are registered for every session.
create table registration_sessions (
  registration_id uuid not null references registrations (id) on delete cascade,
  session_id uuid not null references sessions (id) on delete cascade,
  primary key (registration_id, session_id)
);

create table outline_orders (
  training_id uuid not null references trainings (id) on delete cascade,
  language language_code not null,
  quantity integer not null check (quantity >= 0),
  primary key (training_id, language)
);

-- Stage 2: during the training ---------------------------------------------

create table study_groups (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings (id) on delete cascade,
  name text not null,
  language language_code not null,
  locality_id uuid references localities (id) on delete set null,
  sort_order integer not null default 0
);

create table study_group_members (
  group_id uuid not null references study_groups (id) on delete cascade,
  registration_id uuid not null references registrations (id) on delete cascade,
  primary key (group_id, registration_id)
);

create table attendance (
  registration_id uuid not null references registrations (id) on delete cascade,
  session_id uuid not null references sessions (id) on delete cascade,
  mark attendance_mark not null,
  recorded_by uuid references auth.users (id) on delete set null,
  recorded_at timestamptz not null default now(),
  primary key (registration_id, session_id)
);

create table services (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings (id) on delete cascade,
  name text not null,                          -- e.g. Technik, Regeln, Lieder
  lead text not null default '',
  sort_order integer not null default 0
);

create table message_hymns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  position integer not null,
  number_en text not null,                     -- every hymn exists in English
  number_de text,                              -- null when there is no German version
  number_ru text
);

create table message_verses (
  session_id uuid primary key references sessions (id) on delete cascade,
  body jsonb not null default '{}'::jsonb      -- per-language text for the screen
);

create table test_slots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  group_id uuid not null references study_groups (id) on delete cascade,
  note text not null default ''
);

-- Stage 3: reimbursements --------------------------------------------------

create table reimbursements (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings (id) on delete cascade,
  description text not null,
  amount_cents integer not null check (amount_cents >= 0),
  receipt_path text,                           -- Supabase Storage object
  created_at timestamptz not null default now()
);

-- updated_at ---------------------------------------------------------------

create function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trainings_touch before update on trainings
  for each row execute function touch_updated_at();
create trigger registrations_touch before update on registrations
  for each row execute function touch_updated_at();

-- Copy last training -------------------------------------------------------
-- Copies schedule (shifted by p_shift), localities, services, fees, rules and
-- payment details. Registrations are never copied.

create function copy_training(p_source uuid, p_slug text, p_title jsonb, p_shift interval)
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

  insert into services (training_id, name, sort_order)
  select new_id, name, sort_order from services where training_id = p_source;

  return new_id;
end;
$$;

-- Personal data removal ----------------------------------------------------
-- Run once the Lebensstrom report is accepted. Keeps counts, drops names and
-- contact details.

create function purge_personal_data(p_training uuid) returns void
language sql security invoker as $$
  update registrations set
    first_name = '-', last_name = '-',
    partner_first_name = case when seat_type = 'shared' then '-' end,
    partner_last_name = case when seat_type = 'shared' then '-' end,
    email = '-', phone = '', comments = '', waiver_reason = '',
    edit_token_hash = encode(gen_random_bytes(32), 'hex')
  where training_id = p_training;
$$;

-- Row-level security -------------------------------------------------------

alter table coordinators enable row level security;
alter table trainings enable row level security;
alter table sessions enable row level security;
alter table localities enable row level security;
alter table registrations enable row level security;
alter table registration_sessions enable row level security;
alter table outline_orders enable row level security;
alter table study_groups enable row level security;
alter table study_group_members enable row level security;
alter table attendance enable row level security;
alter table services enable row level security;
alter table message_hymns enable row level security;
alter table message_verses enable row level security;
alter table test_slots enable row level security;
alter table reimbursements enable row level security;

-- The public form may read published trainings and their schedule.
create policy "public reads published trainings" on trainings
  for select using (is_published or is_coordinator());
create policy "public reads published sessions" on sessions
  for select using (
    is_coordinator()
    or exists (select 1 from trainings t where t.id = training_id and t.is_published)
  );
create policy "public reads published localities" on localities
  for select using (
    is_coordinator()
    or exists (select 1 from trainings t where t.id = training_id and t.is_published)
  );

create policy "coordinators see coordinators" on coordinators
  for select using (is_coordinator());

-- Coordinators can do everything else. All of them edit live, together.
do $$
declare
  t text;
begin
  foreach t in array array[
    'trainings', 'sessions', 'localities', 'registrations', 'registration_sessions',
    'outline_orders', 'study_groups', 'study_group_members', 'attendance', 'services',
    'message_hymns', 'message_verses', 'test_slots', 'reimbursements'
  ] loop
    execute format(
      'create policy "coordinators write %1$s" on %1$I for all using (is_coordinator()) with check (is_coordinator())',
      t);
  end loop;
end;
$$;

-- Realtime for the shared coordination screens.
alter publication supabase_realtime add table registrations, attendance, study_group_members;
