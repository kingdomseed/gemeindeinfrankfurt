-- Anaheim attendees order no outline, so the outline language is empty for
-- them and required for every other seat.
alter table registrations alter column outline_language drop not null;

update registrations
  set seat_type = 'anaheim', outline_language = null, second_outline_language = null
  where attended_anaheim;

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
