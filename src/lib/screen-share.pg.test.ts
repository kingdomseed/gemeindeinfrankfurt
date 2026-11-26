import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const DB_URL = process.env.SCRATCH_DB_URL;

function scratchUrlFor(baseUrl: string, dbName: string): string {
  if (!baseUrl) return "";
  const url = new URL(baseUrl);
  url.pathname = `/${dbName}`;
  return url.toString();
}

function psql(url: string, args: string[]): string {
  return execFileSync("psql", [url, "-qXAt", "-v", "ON_ERROR_STOP=1", ...args], {
    env: { ...process.env, PGOPTIONS: "-c client_min_messages=error" },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

describe.skipIf(!DB_URL)("trainings screen_token migration", () => {
  const serverUrl = DB_URL ?? "";
  const dbName = `screen_share_test_${process.pid}_${Date.now()}`;
  const testDbUrl = scratchUrlFor(serverUrl, dbName);
  const root = process.cwd();

  beforeAll(() => {
    psql(serverUrl, ["-c", `create database ${dbName}`]);
    psql(testDbUrl, ["-f", join(root, "supabase/scratch/supabase-stub.sql")]);
    const migrationDir = join(root, "supabase/migrations");
    const files = readdirSync(migrationDir)
      .filter((name) => name.endsWith(".sql"))
      .toSorted();
    for (const file of files) {
      psql(testDbUrl, ["-f", join(migrationDir, file)]);
    }
  }, 30_000);

  afterAll(() => {
    if (!serverUrl) return;
    psql(serverUrl, ["-c", `drop database if exists ${dbName} with (force)`]);
  });

  it("generates unique 48-hex screen tokens and enforces length and uniqueness constraints", () => {
    psql(testDbUrl, [
      "-c",
      `
      insert into trainings (slug, title, fee_cents, outline_price_cents) values
        ('t1', '{"de":"A","en":"A","ru":"A"}'::jsonb, 7000, 500),
        ('t2', '{"de":"B","en":"B","ru":"B"}'::jsonb, 7000, 500);
      `,
    ]);

    const tokens = psql(testDbUrl, [
      "-c",
      "select screen_token from trainings order by slug;",
    ]).split("\n");
    expect(tokens).toHaveLength(2);
    for (const token of tokens) {
      expect(token).toMatch(/^[0-9a-f]{48}$/);
    }
    expect(tokens[0]).not.toBe(tokens[1]);

    // Rejects duplicate screen tokens.
    expect(() =>
      psql(testDbUrl, [
        "-c",
        `insert into trainings (slug, title, fee_cents, outline_price_cents, screen_token)
         values ('t3', '{"de":"C","en":"C","ru":"C"}'::jsonb, 7000, 500, '${tokens[0]}');`,
      ]),
    ).toThrow(/trainings_screen_token_key/);

    // Rejects short tokens (< 32 chars).
    expect(() =>
      psql(testDbUrl, [
        "-c",
        `insert into trainings (slug, title, fee_cents, outline_price_cents, screen_token)
         values ('t4', '{"de":"D","en":"D","ru":"D"}'::jsonb, 7000, 500, 'short-token');`,
      ]),
    ).toThrow(/trainings_screen_token_check/);
  });
});
