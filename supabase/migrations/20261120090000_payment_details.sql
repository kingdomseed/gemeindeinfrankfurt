-- Coordinators mark payments on the registration's own page. Each payment
-- keeps the day it arrived and, when there is one, the bank's transaction
-- number, so a later question can be traced to the bank statement.
alter table registrations
  add column fee_paid_on date,
  add column fee_transaction text not null default '' check (char_length(fee_transaction) <= 100),
  add column outline_paid_on date,
  add column outline_transaction text not null default ''
    check (char_length(outline_transaction) <= 100);

-- What happened to a registration, and who did it. Written by server actions.
create table registration_events (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations (id) on delete cascade,
  kind text not null check (kind in (
    'fee_received', 'fee_unmarked', 'outline_received', 'outline_unmarked',
    'waiver_set', 'waiver_removed', 'edited', 'cancelled', 'link_sent'
  )),
  actor_id uuid default auth.uid() references auth.users (id) on delete set null,
  actor_name text not null default '',
  created_at timestamptz not null default now()
);

create index registration_events_registration_idx
  on registration_events (registration_id, created_at desc);

alter table registration_events enable row level security;

create policy "coordinators read registration_events" on registration_events
  for select to authenticated using ((select is_coordinator()));
create policy "coordinators add registration_events" on registration_events
  for insert to authenticated with check ((select is_coordinator()));

-- Transaction numbers identify a person's bank transfer, so the purge clears them.
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
$$;
