-- Atomic Postgres RPCs for registration creation, edit (with optimistic
-- concurrency, session replacement, study-group language sync, and audit log),
-- cancellation, and coordinator payment updates.

create or replace function sync_registration_study_group(
  p_registration uuid,
  p_training uuid,
  p_language language_code
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_target_group uuid;
  v_next_order integer;
begin
  perform pg_advisory_xact_lock(hashtext('study_groups:' || p_training::text));

  if not exists (select 1 from study_groups where training_id = p_training) then
    return;
  end if;

  select sg.id
  into v_target_group
  from study_groups sg
  left join study_group_members sgm on sgm.group_id = sg.id
  left join registrations r
    on r.id = sgm.registration_id
    and r.status = 'active'
    and r.id <> p_registration
  where sg.training_id = p_training
    and sg.language = p_language
  group by sg.id, sg.sort_order
  order by count(r.id) asc, sg.sort_order asc
  limit 1;

  if v_target_group is null then
    select coalesce(max(sort_order), 0) + 1
    into v_next_order
    from study_groups
    where training_id = p_training;

    insert into study_groups (training_id, name, language, sort_order)
    values (p_training, v_next_order::text, p_language, v_next_order)
    returning id into v_target_group;
  end if;

  insert into study_group_members (group_id, registration_id)
  values (v_target_group, p_registration)
  on conflict (registration_id) do update set group_id = excluded.group_id;
end;
$$;

create or replace function create_registration(
  p_training_id uuid,
  p_locale language_code,
  p_edit_token_hash text,
  p_seat_type seat_type,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_other_locality text,
  p_group_language language_code,
  p_comments text,
  p_confirmed_adult boolean,
  p_accepted_rules boolean,
  p_session_ids uuid[],
  p_partner_first_name text default null,
  p_partner_last_name text default null,
  p_locality_id uuid default null,
  p_site_id uuid default null,
  p_outline_language language_code default null,
  p_second_outline_language language_code default null
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into registrations (
    training_id,
    locale,
    edit_token_hash,
    seat_type,
    first_name,
    last_name,
    partner_first_name,
    partner_last_name,
    email,
    phone,
    locality_id,
    other_locality,
    site_id,
    group_language,
    outline_language,
    second_outline_language,
    comments,
    confirmed_adult,
    accepted_rules
  ) values (
    p_training_id,
    p_locale,
    p_edit_token_hash,
    p_seat_type,
    p_first_name,
    p_last_name,
    p_partner_first_name,
    p_partner_last_name,
    p_email,
    p_phone,
    p_locality_id,
    p_other_locality,
    p_site_id,
    p_group_language,
    p_outline_language,
    p_second_outline_language,
    p_comments,
    p_confirmed_adult,
    p_accepted_rules
  )
  returning id into v_id;

  if p_seat_type in ('part_time', 'anaheim') and coalesce(array_length(p_session_ids, 1), 0) > 0 then
    insert into registration_sessions (registration_id, session_id)
    select v_id, s
    from unnest(p_session_ids) as s
    on conflict do nothing;
  end if;

  return v_id;
end;
$$;

create or replace function save_registration(
  p_id uuid,
  p_seat_type seat_type,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_other_locality text,
  p_group_language language_code,
  p_comments text,
  p_confirmed_adult boolean,
  p_accepted_rules boolean,
  p_replace_sessions boolean,
  p_session_ids uuid[],
  p_expected_updated_at timestamptz default null,
  p_locale language_code default null,
  p_partner_first_name text default null,
  p_partner_last_name text default null,
  p_locality_id uuid default null,
  p_site_id uuid default null,
  p_outline_language language_code default null,
  p_second_outline_language language_code default null
) returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_existing registrations%rowtype;
  v_actor_name text;
begin
  select *
  into v_existing
  from registrations
  where id = p_id
  for update;

  if not found or v_existing.status <> 'active' then
    return 'not_found';
  end if;

  if p_expected_updated_at is not null and v_existing.updated_at <> p_expected_updated_at then
    return 'stale';
  end if;

  update registrations
  set
    locale = coalesce(p_locale, locale),
    seat_type = p_seat_type,
    first_name = p_first_name,
    last_name = p_last_name,
    partner_first_name = p_partner_first_name,
    partner_last_name = p_partner_last_name,
    email = p_email,
    phone = p_phone,
    locality_id = p_locality_id,
    other_locality = p_other_locality,
    site_id = p_site_id,
    group_language = p_group_language,
    outline_language = p_outline_language,
    second_outline_language = p_second_outline_language,
    comments = p_comments,
    confirmed_adult = p_confirmed_adult,
    accepted_rules = p_accepted_rules
  where id = p_id;

  if p_replace_sessions then
    delete from registration_sessions where registration_id = p_id;
    if p_seat_type in ('part_time', 'anaheim') and coalesce(array_length(p_session_ids, 1), 0) > 0 then
      insert into registration_sessions (registration_id, session_id)
      select p_id, s
      from unnest(p_session_ids) as s
      on conflict do nothing;
    end if;
  end if;

  if v_existing.group_language is distinct from p_group_language then
    perform sync_registration_study_group(p_id, v_existing.training_id, p_group_language);
  end if;

  v_actor_name := coalesce((select display_name from coordinators where user_id = auth.uid()), '');
  insert into registration_events (registration_id, kind, actor_id, actor_name)
  values (p_id, 'edited', auth.uid(), v_actor_name);

  return 'saved';
end;
$$;

create or replace function cancel_registration(p_id uuid) returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_status registration_status;
  v_actor_name text;
begin
  select status
  into v_status
  from registrations
  where id = p_id
  for update;

  if not found or v_status <> 'active' then
    return 'not_found';
  end if;

  update registrations
  set status = 'cancelled', cancelled_at = now()
  where id = p_id;

  delete from study_group_members where registration_id = p_id;

  v_actor_name := coalesce((select display_name from coordinators where user_id = auth.uid()), '');
  insert into registration_events (registration_id, kind, actor_id, actor_name)
  values (p_id, 'cancelled', auth.uid(), v_actor_name);

  return 'cancelled';
end;
$$;

create or replace function save_registration_payment(
  p_id uuid,
  p_expected_updated_at timestamptz,
  p_update_fee boolean,
  p_fee_paid boolean,
  p_fee_transaction text,
  p_update_outline boolean,
  p_outline_paid boolean,
  p_outline_transaction text,
  p_waiver_reason text,
  p_events text[],
  p_fee_paid_on date default null,
  p_outline_paid_on date default null,
  p_waiver fee_waiver default null
) returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_existing registrations%rowtype;
  v_actor_name text;
begin
  select *
  into v_existing
  from registrations
  where id = p_id
  for update;

  if not found or v_existing.status <> 'active' or v_existing.seat_type = 'anaheim' then
    return 'not_found';
  end if;

  if v_existing.updated_at <> p_expected_updated_at then
    return 'stale';
  end if;

  update registrations
  set
    fee_paid = case when p_update_fee then p_fee_paid else fee_paid end,
    fee_paid_on = case when p_update_fee then p_fee_paid_on else fee_paid_on end,
    fee_transaction = case when p_update_fee then p_fee_transaction else fee_transaction end,
    outline_paid = case when p_update_outline then p_outline_paid else outline_paid end,
    outline_paid_on = case when p_update_outline then p_outline_paid_on else outline_paid_on end,
    outline_transaction = case when p_update_outline then p_outline_transaction else outline_transaction end,
    waiver = p_waiver,
    waiver_reason = p_waiver_reason
  where id = p_id;

  if coalesce(array_length(p_events, 1), 0) > 0 then
    v_actor_name := coalesce((select display_name from coordinators where user_id = auth.uid()), '');
    insert into registration_events (registration_id, kind, actor_id, actor_name)
    select p_id, k, auth.uid(), v_actor_name
    from unnest(p_events) as k;
  end if;

  return 'saved';
end;
$$;

revoke execute on function sync_registration_study_group(uuid, uuid, language_code) from public, anon;
grant execute on function sync_registration_study_group(uuid, uuid, language_code) to authenticated, service_role;

revoke execute on function create_registration(
  uuid, language_code, text, seat_type, text, text, text, text, text, language_code,
  text, boolean, boolean, uuid[], text, text, uuid, uuid, language_code, language_code
) from public, anon, authenticated;
grant execute on function create_registration(
  uuid, language_code, text, seat_type, text, text, text, text, text, language_code,
  text, boolean, boolean, uuid[], text, text, uuid, uuid, language_code, language_code
) to service_role;

revoke execute on function save_registration(
  uuid, seat_type, text, text, text, text, text, language_code, text, boolean, boolean,
  boolean, uuid[], timestamptz, language_code, text, text, uuid, uuid, language_code, language_code
) from public, anon;
grant execute on function save_registration(
  uuid, seat_type, text, text, text, text, text, language_code, text, boolean, boolean,
  boolean, uuid[], timestamptz, language_code, text, text, uuid, uuid, language_code, language_code
) to authenticated, service_role;

revoke execute on function cancel_registration(uuid) from public, anon;
grant execute on function cancel_registration(uuid) to authenticated, service_role;

revoke execute on function save_registration_payment(
  uuid, timestamptz, boolean, boolean, text, boolean, boolean, text, text, text[], date, date, fee_waiver
) from public, anon;
grant execute on function save_registration_payment(
  uuid, timestamptz, boolean, boolean, text, boolean, boolean, text, text, text[], date, date, fee_waiver
) to authenticated, service_role;
