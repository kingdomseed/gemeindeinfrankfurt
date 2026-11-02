-- Optional name of the person who sends the bank transfer, when it is not the
-- registrant (a spouse, a parent, one transfer for a family). Coordinators use
-- it to match transfers to registrations, since the payment reference is shared.
alter table registrations
  add column payer_name text not null default '' check (char_length(payer_name) <= 200);
