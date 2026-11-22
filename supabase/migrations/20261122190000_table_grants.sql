-- This project was created without Supabase's default table privileges, so
-- service_role, authenticated and anon had no SELECT/INSERT/UPDATE/DELETE on
-- the tables in public and every query failed with "permission denied".
-- Restore the standard Supabase grants; row level security on each table
-- still decides which rows each role can see or change.
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public
  to anon, authenticated, service_role;
grant usage, select on all sequences in schema public
  to anon, authenticated, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
