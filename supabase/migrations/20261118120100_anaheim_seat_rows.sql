-- Anaheim attendees order no outline, so the outline language is empty for
-- them and required for every other seat.
alter table registrations alter column outline_language drop not null;

-- A shared seat is two people, which the Anaheim seat cannot hold: it stays
-- shared and keeps its free donation as a coordinator waiver.
update registrations
  set waiver = 'anaheim'
  where attended_anaheim and seat_type = 'shared' and waiver is null;

-- A full-time seat had every message implicitly. As an Anaheim seat it lists
-- the messages it joins, so it gets all of them.
insert into registration_sessions (registration_id, session_id)
  select r.id, s.id
  from registrations r
  join sessions s on s.training_id = r.training_id
  where r.attended_anaheim and r.seat_type = 'full_time'
on conflict do nothing;

update registrations
  set seat_type = 'anaheim', outline_language = null, second_outline_language = null
  where attended_anaheim and seat_type <> 'shared';

alter table registrations
  add constraint registrations_outline_by_seat check (
    case when seat_type = 'anaheim'
      then outline_language is null and second_outline_language is null
      else outline_language is not null
    end
  );

-- The Anaheim checkbox is now the seat type, and the form no longer asks about
-- employment or origin: that is a private matter.
alter table registrations drop column attended_anaheim;
alter table registrations drop column ukraine_not_employed;
