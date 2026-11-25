-- Whether a session is held online (e.g. weekday evenings on Zoom) or in person
-- (e.g. weekends at the training's attendance locations). Coordinators toggle this
-- per message in Setup -> Schedule; the public Format section derives its days from it.
alter table sessions
  add column is_online boolean not null default false;

-- Existing sessions: Monday–Friday in Europe/Berlin are online; Saturday and Sunday are in person.
update sessions
  set is_online = (extract(isodow from starts_at at time zone 'Europe/Berlin') between 1 and 5);

-- Copy last training now preserves is_online too ------------------------------
create or replace function copy_training(p_source uuid, p_slug text, p_title jsonb, p_shift interval)
returns uuid language plpgsql security invoker set search_path = public as $$
declare
  new_id uuid;
begin
  insert into trainings (slug, title, fee_cents, outline_price_cents, payee_name,
                         payee_iban, payment_reference, venue, rules)
  select p_slug, p_title, fee_cents, outline_price_cents, payee_name,
         payee_iban, payment_reference, venue, rules
  from trainings where id = p_source
  returning id into new_id;

  insert into sessions (training_id, message_number, starts_at, ends_at, is_tested, is_online)
  select new_id, message_number, starts_at + p_shift, ends_at + p_shift, is_tested, is_online
  from sessions where training_id = p_source;

  insert into localities (training_id, name, is_home)
  select new_id, name, is_home from localities where training_id = p_source;

  insert into training_sites (training_id, name, sort_order)
  select new_id, name, sort_order from training_sites where training_id = p_source;

  insert into services (training_id, kind, name, sort_order)
  select new_id, kind, name, sort_order from services where training_id = p_source;

  return new_id;
end;
$$;
