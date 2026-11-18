-- Anaheim attendees register as their own seat type: they pick the messages
-- they would like to join, pay no fee and need no outline. The new enum value
-- is added on its own, because Postgres cannot use it in the same transaction.
alter type seat_type add value if not exists 'anaheim';
