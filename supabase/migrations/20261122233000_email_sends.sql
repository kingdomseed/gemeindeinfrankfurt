-- Every email a coordinator sends from the Emails page: which kind, its
-- subject, who sent it and to how many people. The recipients themselves
-- are not stored. New table, so no existing rows.
create table email_sends (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings (id) on delete cascade,
  kind text not null check (kind in ('payment_reminder', 'before_training', 'message')),
  subject text not null default '' check (char_length(subject) <= 300),
  sent_by text not null default '',
  recipient_count integer not null check (recipient_count >= 0),
  sent_at timestamptz not null default now()
);

create index email_sends_training_idx on email_sends (training_id, sent_at desc);

alter table email_sends enable row level security;

create policy "coordinators read email_sends" on email_sends
  for select to authenticated using ((select is_coordinator()));
create policy "coordinators add email_sends" on email_sends
  for insert to authenticated with check ((select is_coordinator()));

grant select, insert on email_sends to authenticated;
grant select, insert, update, delete on email_sends to service_role;
