-- The report to Lebensstrom: the questionnaire's yes/no answers, the
-- training's actual first and last day and the notes. They live in their own
-- table because published trainings rows are readable by anyone; this one is
-- for coordinators only. A missing row or a null answer means unanswered, and
-- the page shows what the training's data suggests.
create table training_reports (
  training_id uuid primary key references trainings (id) on delete cascade,
  tested boolean,
  absences_limited boolean,
  name_tags boolean,
  seats_assigned boolean,
  in_person boolean,
  first_day date,
  last_day date,
  notes text not null default '' check (char_length(notes) <= 4000),
  updated_at timestamptz not null default now()
);

create trigger training_reports_touch before update on training_reports
  for each row execute function touch_updated_at();

alter table training_reports enable row level security;

create policy "coordinators read training_reports" on training_reports
  for select to authenticated using ((select is_coordinator()));
create policy "coordinators add training_reports" on training_reports
  for insert to authenticated with check ((select is_coordinator()));
create policy "coordinators change training_reports" on training_reports
  for update to authenticated
  using ((select is_coordinator())) with check ((select is_coordinator()));

grant select, insert, update on training_reports to authenticated;
grant select, insert, update, delete on training_reports to service_role;

-- trainings.report_notes was public with the rest of a published training
-- and nothing wrote it yet; any text in it moves to the private table.
insert into training_reports (training_id, notes)
select id, report_notes from trainings where report_notes <> '';
alter table trainings drop column report_notes;

alter table reimbursements
  add column paid_by text not null default '' check (char_length(paid_by) <= 200),
  add column paid_on date,
  add constraint reimbursements_description_length check (char_length(description) <= 200);

create index reimbursements_training_idx on reimbursements (training_id, created_at);

-- Photos of the invoices. Private: the server reads and writes them for
-- coordinators and shows them through short-lived signed links.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Other coordinators' report screens follow answers and costs live.
alter publication supabase_realtime add table training_reports, reimbursements;

-- Who paid a cost can be a participant's name, so the purge clears it too.
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
  update reimbursements set paid_by = '' where training_id = p_training;
$$;
