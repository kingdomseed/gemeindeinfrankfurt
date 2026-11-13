import * as migration_20261113_154811_initial from "./20261113_154811_initial";

export const migrations = [
  {
    up: migration_20261113_154811_initial.up,
    down: migration_20261113_154811_initial.down,
    name: "20261113_154811_initial",
  },
];
