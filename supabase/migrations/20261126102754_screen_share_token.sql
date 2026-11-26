-- Add an unguessable per-training share token so the room's screen (rules,
-- hymns, and trilingual verses) can be opened live without signing in.
-- Existing rows: every existing training gets a unique random 48-hex token.

alter table trainings
  add column screen_token text not null
  default encode(gen_random_bytes(24), 'hex')
  check (char_length(screen_token) >= 32);

create unique index trainings_screen_token_key on trainings (screen_token);
