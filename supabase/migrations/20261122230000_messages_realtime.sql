-- The room's screen follows hymn numbers and verses as coordinators type
-- them in during a session. Existing rows: unchanged.
alter publication supabase_realtime add table message_hymns, message_verses;
