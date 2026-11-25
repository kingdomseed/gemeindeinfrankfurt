-- Split independent panel timestamps on registrations and training_reports, and
-- move the remaining multi-row / version-checked writes into atomic Postgres RPCs.

-- 1. registrations: payment_updated_at -------------------------------------
alter table registrations add column payment_updated_at timestamptz not null default now();
update registrations set payment_updated_at = updated_at;

create or replace function touch_registration_timestamps() returns trigger
language plpgsql
as $$
begin
  if (
    new.fee_paid, new.fee_paid_on, new.fee_transaction,
    new.outline_paid, new.outline_paid_on, new.outline_transaction,
    new.waiver, new.waiver_reason,
    new.status, new.seat_type, new.outline_language, new.second_outline_language
  ) is distinct from (
    old.fee_paid, old.fee_paid_on, old.fee_transaction,
    old.outline_paid, old.outline_paid_on, old.outline_transaction,
    old.waiver, old.waiver_reason,
    old.status, old.seat_type, old.outline_language, old.second_outline_language
  ) then
    new.payment_updated_at = now();
  end if;

  if (
    new.status, new.cancelled_at, new.seat_type,
    new.first_name, new.last_name, new.partner_first_name, new.partner_last_name,
    new.email, new.phone, new.locale, new.locality_id, new.other_locality, new.site_id,
    new.group_language, new.outline_language, new.second_outline_language,
    new.comments, new.confirmed_adult, new.accepted_rules, new.payer_name
  ) is distinct from (
    old.status, old.cancelled_at, old.seat_type,
    old.first_name, old.last_name, old.partner_first_name, old.partner_last_name,
    old.email, old.phone, old.locale, old.locality_id, old.other_locality, old.site_id,
    old.group_language, old.outline_language, old.second_outline_language,
    old.comments, old.confirmed_adult, old.accepted_rules, old.payer_name
  ) then
    new.updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists registrations_touch on registrations;
create trigger registrations_touch before update on registrations
  for each row execute function touch_registration_timestamps();

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
  for no key update;

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
    accepted_rules = p_accepted_rules,
    updated_at = now()
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
  for no key update;

  if not found or v_existing.status <> 'active' or v_existing.seat_type = 'anaheim' then
    return 'not_found';
  end if;

  if v_existing.payment_updated_at <> p_expected_updated_at then
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
    waiver_reason = p_waiver_reason,
    payment_updated_at = now()
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

-- 2. training_reports: details_updated_at + save_report_details -------------
alter table training_reports add column details_updated_at timestamptz;
update training_reports
set details_updated_at = updated_at
where notes <> '' or first_day is not null or last_day is not null;

create or replace function touch_training_report_timestamps() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if (new.notes, new.first_day, new.last_day) is distinct from (old.notes, old.first_day, old.last_day) then
    new.details_updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists training_reports_touch on training_reports;
create trigger training_reports_touch before update on training_reports
  for each row execute function touch_training_report_timestamps();

create or replace function save_report_details(
  p_training uuid,
  p_notes text,
  p_check_version boolean default true,
  p_first_day date default null,
  p_last_day date default null,
  p_expected_details_updated_at timestamptz default null
) returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_existing_ts timestamptz;
begin
  perform pg_advisory_xact_lock(hashtext('training_reports:' || p_training::text));

  select details_updated_at
  into v_existing_ts
  from training_reports
  where training_id = p_training
  for no key update;

  if not found then
    if p_check_version and p_expected_details_updated_at is not null then
      return 'stale';
    end if;

    insert into training_reports (training_id, notes, first_day, last_day, details_updated_at)
    values (p_training, p_notes, p_first_day, p_last_day, now())
    on conflict (training_id) do nothing;

    if found then
      return 'saved';
    end if;

    select details_updated_at
    into v_existing_ts
    from training_reports
    where training_id = p_training
    for no key update;

    if not found then
      return 'stale';
    end if;
  end if;

  if p_check_version and v_existing_ts is distinct from p_expected_details_updated_at then
    return 'stale';
  end if;

  update training_reports
  set
    notes = p_notes,
    first_day = p_first_day,
    last_day = p_last_day,
    details_updated_at = now()
  where training_id = p_training;

  return 'saved';
end;
$$;

-- 3. Atomic outline orders, schedule, message hymns & verses ---------------
create or replace function save_outline_orders(
  p_training uuid,
  p_de integer,
  p_en integer,
  p_ru integer,
  p_expected_version text default null
) returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_current_version text;
begin
  perform pg_advisory_xact_lock(hashtext('outline_orders:' || p_training::text));

  select
    coalesce(max(quantity) filter (where language = 'de'), 0)::text || ':' ||
    coalesce(max(quantity) filter (where language = 'en'), 0)::text || ':' ||
    coalesce(max(quantity) filter (where language = 'ru'), 0)::text
  into v_current_version
  from outline_orders
  where training_id = p_training;

  if p_expected_version is not null and v_current_version <> p_expected_version then
    return 'stale';
  end if;

  insert into outline_orders (training_id, language, quantity)
  values
    (p_training, 'de', p_de),
    (p_training, 'en', p_en),
    (p_training, 'ru', p_ru)
  on conflict (training_id, language) do update set quantity = excluded.quantity;

  return 'saved';
end;
$$;

create or replace function save_schedule(
  p_training uuid,
  p_sessions jsonb,
  p_expected_state jsonb default null
) returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_current_state jsonb;
begin
  perform pg_advisory_xact_lock(hashtext('sessions:' || p_training::text));

  select coalesce(
    jsonb_agg(
      jsonb_build_array(
        s.id,
        round(extract(epoch from s.starts_at) * 1000)::bigint,
        round(extract(epoch from s.ends_at) * 1000)::bigint,
        s.is_tested,
        s.is_online
      )
      order by s.message_number
    ),
    '[]'::jsonb
  )
  into v_current_state
  from sessions s
  where s.training_id = p_training;

  if p_expected_state is not null and v_current_state <> p_expected_state then
    return 'stale';
  end if;

  update sessions as s
  set
    starts_at = (item ->> 'starts_at')::timestamptz,
    ends_at = (item ->> 'ends_at')::timestamptz,
    is_tested = (item ->> 'is_tested')::boolean,
    is_online = (item ->> 'is_online')::boolean
  from jsonb_array_elements(p_sessions) as item
  where s.training_id = p_training
    and s.id = (item ->> 'id')::uuid;

  return 'saved';
end;
$$;

create or replace function save_message_hymns(
  p_session uuid,
  p_hymns jsonb,
  p_expected_state jsonb default null
) returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_current_state jsonb;
begin
  perform pg_advisory_xact_lock(hashtext('message_hymns:' || p_session::text));

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'en', btrim(h.number_en),
        'de', nullif(btrim(coalesce(h.number_de, '')), ''),
        'ru', nullif(btrim(coalesce(h.number_ru, '')), '')
      )
      order by h.position
    ),
    '[]'::jsonb
  )
  into v_current_state
  from message_hymns h
  where h.session_id = p_session;

  if p_expected_state is not null and v_current_state <> p_expected_state then
    return 'stale';
  end if;

  delete from message_hymns where session_id = p_session;
  insert into message_hymns (session_id, position, number_en, number_de, number_ru)
  select p_session, h.ordinality, h.value ->> 'en', h.value ->> 'de', h.value ->> 'ru'
  from jsonb_array_elements(p_hymns) with ordinality as h (value, ordinality);

  return 'saved';
end;
$$;

create or replace function save_message_verses(
  p_session uuid,
  p_verses jsonb,
  p_expected_state jsonb default null
) returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_current_state jsonb;
begin
  perform pg_advisory_xact_lock(hashtext('message_verses:' || p_session::text));

  select coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'ref', btrim(coalesce(v.value ->> 'ref', '')),
          'de', btrim(coalesce(v.value -> 'text' ->> 'de', '')),
          'en', btrim(coalesce(v.value -> 'text' ->> 'en', '')),
          'ru', btrim(coalesce(v.value -> 'text' ->> 'ru', ''))
        )
        order by v.ordinality
      )
      from message_verses mv
      cross join lateral jsonb_array_elements(
        case when jsonb_typeof(mv.body -> 'verses') = 'array' then mv.body -> 'verses' else '[]'::jsonb end
      ) with ordinality as v (value, ordinality)
      where mv.session_id = p_session
    ),
    '[]'::jsonb
  )
  into v_current_state;

  if p_expected_state is not null and v_current_state <> p_expected_state then
    return 'stale';
  end if;

  insert into message_verses (session_id, body)
  values (p_session, jsonb_build_object('verses', p_verses))
  on conflict (session_id) do update set body = excluded.body;

  return 'saved';
end;
$$;

revoke execute on function save_report_details(uuid, text, boolean, date, date, timestamptz) from public, anon;
grant execute on function save_report_details(uuid, text, boolean, date, date, timestamptz) to authenticated, service_role;

revoke execute on function save_outline_orders(uuid, integer, integer, integer, text) from public, anon;
grant execute on function save_outline_orders(uuid, integer, integer, integer, text) to authenticated, service_role;

revoke execute on function save_schedule(uuid, jsonb, jsonb) from public, anon;
grant execute on function save_schedule(uuid, jsonb, jsonb) to authenticated, service_role;

revoke execute on function save_message_hymns(uuid, jsonb, jsonb) from public, anon;
grant execute on function save_message_hymns(uuid, jsonb, jsonb) to authenticated, service_role;

revoke execute on function save_message_verses(uuid, jsonb, jsonb) from public, anon;
grant execute on function save_message_verses(uuid, jsonb, jsonb) to authenticated, service_role;
