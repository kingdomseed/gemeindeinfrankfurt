-- The report to Lebensstrom: the questionnaire's yes/no answers and the
-- training's actual first and last day, and who paid each cost to reimburse.
-- Existing rows: every answer starts unanswered (null), and the page shows
-- what the training's data suggests until a coordinator answers.
alter table trainings
  add column report_tested boolean,
  add column report_absences_limited boolean,
  add column report_name_tags boolean,
  add column report_seats_assigned boolean,
  add column report_in_person boolean,
  add column report_first_day date,
  add column report_last_day date,
  add constraint trainings_report_notes_length check (char_length(report_notes) <= 4000);

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
