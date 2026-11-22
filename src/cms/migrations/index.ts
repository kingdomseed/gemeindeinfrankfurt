import * as migration_20261113_154811_initial from "./20261113_154811_initial";
import * as migration_20261120_070746_page_sections from "./20261120_070746_page_sections";
import * as migration_20261122_185121_events from "./20261122_185121_events";
import * as migration_20261122_192636_announcement_import_key from "./20261122_192636_announcement_import_key";

export const migrations = [
  {
    up: migration_20261113_154811_initial.up,
    down: migration_20261113_154811_initial.down,
    name: "20261113_154811_initial",
  },
  {
    up: migration_20261120_070746_page_sections.up,
    down: migration_20261120_070746_page_sections.down,
    name: "20261120_070746_page_sections",
  },
  {
    up: migration_20261122_185121_events.up,
    down: migration_20261122_185121_events.down,
    name: "20261122_185121_events",
  },
  {
    up: migration_20261122_192636_announcement_import_key.up,
    down: migration_20261122_192636_announcement_import_key.down,
    name: "20261122_192636_announcement_import_key",
  },
];
