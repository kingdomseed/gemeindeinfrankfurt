-- Optional name of the person who sends the bank transfer, when it is not the
-- registrant (a spouse, a parent, one transfer for a family). Coordinators use
-- it to match transfers to registrations, since the payment reference is shared.
alter table registrations
  add column payer_name text not null default '' check (char_length(payer_name) <= 200);

-- The payer's name is personal data too, so the purge must clear it.
create or replace function purge_personal_data(p_training uuid) returns void
language sql security invoker as $$
  update registrations set
    first_name = '-', last_name = '-',
    partner_first_name = case when seat_type = 'shared' then '-' end,
    partner_last_name = case when seat_type = 'shared' then '-' end,
    email = '-', phone = '', comments = '', waiver_reason = '', payer_name = '',
    edit_token_hash = encode(gen_random_bytes(32), 'hex')
  where training_id = p_training;
$$;
