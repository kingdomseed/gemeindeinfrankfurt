-- Training attendance sites ("Frankfurt am Main", "Mannheim/Heidelberg"),
-- free-text "other" locality support on registrations, and the neighboring
-- localities that register through Frankfurt.

-- Training sites -------------------------------------------------------------
create table training_sites (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  sort_order integer not null default 0,
  unique (training_id, name)
);

create index training_sites_training_idx on training_sites (training_id, sort_order);

alter table training_sites enable row level security;

create policy "public reads published training_sites" on training_sites
  for select to anon, authenticated using (
    (select is_coordinator())
    or exists (select 1 from trainings t where t.id = training_sites.training_id and t.is_published)
  );
create policy "coordinators add training_sites" on training_sites
  for insert to authenticated with check ((select is_coordinator()));
create policy "coordinators change training_sites" on training_sites
  for update to authenticated
  using ((select is_coordinator())) with check ((select is_coordinator()));
create policy "coordinators remove training_sites" on training_sites
  for delete to authenticated using ((select is_coordinator()));

grant select on training_sites to anon;
grant select, insert, update, delete on training_sites to authenticated, service_role;

alter publication supabase_realtime add table training_sites;

-- Registrations: attendance site + custom "other" locality -------------------
-- Existing rows: site_id starts null and other_locality starts '' so existing
-- rows satisfy registrations_locality_exclusive.
alter table registrations
  add column site_id uuid references training_sites (id) on delete set null,
  add column other_locality text not null default '' check (char_length(other_locality) <= 100),
  add constraint registrations_locality_exclusive check (locality_id is null or other_locality = '');

create index registrations_locality_idx
  on registrations (locality_id) where locality_id is not null;
create index registrations_site_idx
  on registrations (site_id) where site_id is not null;

-- Copy last training now copies training_sites too --------------------------
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

  insert into sessions (training_id, message_number, starts_at, ends_at, is_tested)
  select new_id, message_number, starts_at + p_shift, ends_at + p_shift, is_tested
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

-- Existing trainings: add neighboring localities and default training sites.
-- Idempotent: existing trainings that already have any of these rows keep them.
insert into localities (training_id, name, is_home)
select t.id, l.name, false
from trainings t
cross join (values
  ('Darmstadt'),
  ('Heidelberg'),
  ('Kaiserslautern'),
  ('Mannheim'),
  ('Saarbrücken'),
  ('Theley')
) as l (name)
where exists (
  select 1 from localities h
  where h.training_id = t.id and h.is_home and h.name = 'Frankfurt am Main'
)
on conflict (training_id, name) do nothing;

insert into training_sites (training_id, name, sort_order)
select t.id, s.name, s.sort_order
from trainings t
cross join (values
  ('Frankfurt am Main', 1),
  ('Mannheim/Heidelberg', 2)
) as s (name, sort_order)
where not exists (select 1 from training_sites existing where existing.training_id = t.id)
on conflict (training_id, name) do nothing;
