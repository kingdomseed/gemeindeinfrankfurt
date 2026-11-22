-- The room's screen follows hymn numbers and verses as coordinators type
-- them in during a session. Existing rows: unchanged.
alter publication supabase_realtime add table message_hymns, message_verses;

-- A message's hymns are replaced in one transaction, and two coordinators
-- saving the same message at once wait for each other. Existing rows: no
-- message has hymns yet, so the new key on (session_id, position) holds.
alter table message_hymns
  add constraint message_hymns_session_position_key unique (session_id, position);

-- p_hymns is [{"en": "501", "de": "214", "ru": null}, ...] in singing order.
create function replace_message_hymns(p_session uuid, p_hymns jsonb) returns void
language plpgsql security invoker set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext('message_hymns:' || p_session::text));
  delete from message_hymns where session_id = p_session;
  insert into message_hymns (session_id, position, number_en, number_de, number_ru)
  select p_session, h.ordinality, h.value ->> 'en', h.value ->> 'de', h.value ->> 'ru'
  from jsonb_array_elements(p_hymns) with ordinality as h (value, ordinality);
end;
$$;
