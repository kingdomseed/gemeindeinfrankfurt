-- Isolate separate-site study groups (Mannheim/Heidelberg) from the main
-- training groups via optional site_id on study_groups.

alter table study_groups
  add column site_id uuid references training_sites (id) on delete set null;

create index study_groups_training_site_idx on study_groups (training_id, site_id);

-- Replaces a training's study groups (and planned tests) with new ones in one
-- transaction. Each element of p_groups may carry an optional site_id.
create or replace function replace_study_groups(p_training uuid, p_groups jsonb) returns void
language plpgsql security invoker set search_path = public as $$
declare
  g jsonb;
  n integer := 0;
  new_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('study_groups:' || p_training::text));
  delete from study_groups where training_id = p_training;
  for g in select * from jsonb_array_elements(p_groups) loop
    n := n + 1;
    insert into study_groups (training_id, name, language, site_id, sort_order)
    values (
      p_training,
      n::text,
      (g ->> 'language')::language_code,
      nullif(g ->> 'site_id', '')::uuid,
      n
    )
    returning id into new_id;
    insert into study_group_members (group_id, registration_id)
    select new_id, m::uuid from jsonb_array_elements_text(g -> 'members') as m;
  end loop;
end;
$$;

-- Keeps an edited or re-synced registration inside an appropriate group:
-- separate sites (Mannheim/Heidelberg or any site with a dedicated group) stay
-- isolated from general groups.
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
  v_site_id uuid;
  v_site_name text;
  v_is_separate boolean := false;
  v_target_group uuid;
  v_next_order integer;
begin
  perform pg_advisory_xact_lock(hashtext('study_groups:' || p_training::text));

  if not exists (select 1 from study_groups where training_id = p_training) then
    return;
  end if;

  select r.site_id, ts.name
  into v_site_id, v_site_name
  from registrations r
  left join training_sites ts on ts.id = r.site_id
  where r.id = p_registration;

  if v_site_id is not null then
    v_is_separate :=
      coalesce(v_site_name, '') ~* 'mannheim|heidelberg'
      or exists (
        select 1
        from study_groups sg
        where sg.training_id = p_training
          and sg.site_id = v_site_id
      );
  end if;

  if v_is_separate then
    select sg.id
    into v_target_group
    from study_groups sg
    left join study_group_members sgm on sgm.group_id = sg.id
    left join registrations r
      on r.id = sgm.registration_id
      and r.status = 'active'
      and r.id <> p_registration
    where sg.training_id = p_training
      and sg.site_id = v_site_id
    group by sg.id, sg.language, sg.sort_order
    order by
      case when sg.language = p_language then 0 else 1 end asc,
      count(r.id) asc,
      sg.sort_order asc
    limit 1;

    if v_target_group is null then
      select coalesce(max(sort_order), 0) + 1
      into v_next_order
      from study_groups
      where training_id = p_training;

      insert into study_groups (training_id, name, language, site_id, sort_order)
      values (p_training, v_next_order::text, p_language, v_site_id, v_next_order)
      returning id into v_target_group;
    end if;
  else
    select sg.id
    into v_target_group
    from study_groups sg
    left join study_group_members sgm on sgm.group_id = sg.id
    left join registrations r
      on r.id = sgm.registration_id
      and r.status = 'active'
      and r.id <> p_registration
    where sg.training_id = p_training
      and sg.site_id is null
      and sg.language = p_language
    group by sg.id, sg.sort_order
    order by count(r.id) asc, sg.sort_order asc
    limit 1;

    if v_target_group is null then
      select coalesce(max(sort_order), 0) + 1
      into v_next_order
      from study_groups
      where training_id = p_training;

      insert into study_groups (training_id, name, language, site_id, sort_order)
      values (p_training, v_next_order::text, p_language, null, v_next_order)
      returning id into v_target_group;
    end if;
  end if;

  insert into study_group_members (group_id, registration_id)
  values (v_target_group, p_registration)
  on conflict (registration_id) do update set group_id = excluded.group_id;
end;
$$;

-- Re-sync study group when either group_language or attendance site changes.
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

  if v_existing.group_language is distinct from p_group_language
     or v_existing.site_id is distinct from p_site_id then
    perform sync_registration_study_group(p_id, v_existing.training_id, p_group_language);
  end if;

  v_actor_name := coalesce((select display_name from coordinators where user_id = auth.uid()), '');
  insert into registration_events (registration_id, kind, actor_id, actor_name)
  values (p_id, 'edited', auth.uid(), v_actor_name);

  return 'saved';
end;
$$;
