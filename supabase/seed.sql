-- Local development data. Contains NO personal data: never add real names,
-- emails or phone numbers here. Dates, IBAN and reference are placeholders.

insert into trainings (id, slug, title, is_published, fee_cents, outline_price_cents,
                       payee_name, payee_iban, payment_reference, venue, rules)
values (
  '00000000-0000-4000-8000-000000000001',
  '2026-12',
  '{"de": "Videotraining Dezember 2026", "en": "Video Training December 2026", "ru": "Видеотренинг, декабрь 2026"}',
  true, 7000, 500,
  'Gemeinde (Beispiel)', 'DE00 0000 0000 0000 0000 00', 'Videotraining 2027 (Beispiel)',
  'Frankfurt am Main',
  '{"de": "Mindestens 18 Jahre. Keine unentschuldigten Fehlzeiten, höchstens zwei entschuldigte.",
    "en": "18 or older. No unexcused absences, at most two excused.",
    "ru": "Не моложе 18 лет. Без неуважительных пропусков, не более двух уважительных."}'
);

-- Twelve messages over two weeks (Tue, Fri, Sat x2, Lord''s Day x2), the
-- pattern Frankfurt used before. Placeholder dates in January 2027.
insert into sessions (training_id, message_number, starts_at, ends_at, is_tested)
select '00000000-0000-4000-8000-000000000001', n, s, s + interval '2 hours 30 minutes', n <= 10
from (
  select row_number() over (order by s) as n, s
  from unnest(array[
    '2027-01-05 19:00', '2027-01-08 19:00', '2027-01-09 09:30', '2027-01-09 15:00',
    '2027-01-10 09:45', '2027-01-10 15:00', '2027-01-12 19:00', '2027-01-15 19:00',
    '2027-01-16 09:30', '2027-01-16 15:00', '2027-01-17 09:45', '2027-01-17 15:00'
  ]::timestamp[]) as t(local_time),
  lateral (select local_time at time zone 'Europe/Berlin' as s) z
) x;

insert into localities (training_id, name, is_home) values
  ('00000000-0000-4000-8000-000000000001', 'Frankfurt am Main', true),
  ('00000000-0000-4000-8000-000000000001', 'Mannheim', false),
  ('00000000-0000-4000-8000-000000000001', 'Heidelberg', false);

insert into services (training_id, name, sort_order) values
  ('00000000-0000-4000-8000-000000000001', 'Technik', 1),
  ('00000000-0000-4000-8000-000000000001', 'Regeln', 2),
  ('00000000-0000-4000-8000-000000000001', 'Lieder', 3),
  ('00000000-0000-4000-8000-000000000001', 'Verse', 4),
  ('00000000-0000-4000-8000-000000000001', 'Fragen', 5),
  ('00000000-0000-4000-8000-000000000001', 'Anwesenheit', 6),
  ('00000000-0000-4000-8000-000000000001', 'Zahlungen', 7),
  ('00000000-0000-4000-8000-000000000001', 'Namensschilder', 8),
  ('00000000-0000-4000-8000-000000000001', 'Gruppen', 9);
