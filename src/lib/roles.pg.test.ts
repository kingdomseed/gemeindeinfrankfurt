import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const DB_URL = process.env.SCRATCH_DB_URL;

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const COORD_ID = "22222222-2222-4222-8222-222222222222";
const HELPER_ID = "33333333-3333-4333-8333-333333333333";

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

function psqlAs(
  url: string,
  role: "service_role" | "authenticated" | "anon",
  sql: string,
  sub?: string,
): string {
  const claims = sub
    ? `set local "request.jwt.claim.sub" = '${sub}';`
    : "set local \"request.jwt.claim.sub\" = '';";
  return psql(url, ["-c", `begin; set local role ${role}; ${claims}\n${sql}\ncommit;`]);
}

describe.skipIf(!DB_URL)("helper role and role_permissions migration", () => {
  const serverUrl = DB_URL ?? "";
  const dbName = `roles_pg_test_${process.pid}_${Date.now()}`;
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
    psql(testDbUrl, [
      "-c",
      `
      insert into auth.users (id, email) values
        ('${ADMIN_ID}', 'admin@example.test'),
        ('${COORD_ID}', 'coord@example.test'),
        ('${HELPER_ID}', 'helper@example.test');
      `,
    ]);
  }, 30_000);

  afterAll(() => {
    if (!serverUrl) return;
    psql(serverUrl, ["-c", `drop database if exists ${dbName} with (force)`]);
  });

  it("keeps coordinators.role and is_admin synchronized across inserts and updates", () => {
    psql(testDbUrl, [
      "-c",
      `
      insert into coordinators (user_id, display_name, is_admin) values ('${ADMIN_ID}', 'Admin', true);
      insert into coordinators (user_id, display_name) values ('${COORD_ID}', 'Coord');
      insert into coordinators (user_id, display_name, role) values ('${HELPER_ID}', 'Helper', 'helper');
      `,
    ]);

    expect(
      psql(testDbUrl, [
        "-c",
        "select string_agg(display_name || ':' || role || ':' || is_admin::text, ',' order by display_name) from coordinators;",
      ]),
    ).toBe("Admin:admin:true,Coord:coordinator:false,Helper:helper:false");

    // Promoting via role sets is_admin = true; updating back to helper clears is_admin.
    psql(testDbUrl, [
      "-c",
      `update coordinators set role = 'admin' where user_id = '${HELPER_ID}';`,
    ]);
    expect(
      psql(testDbUrl, ["-c", `select is_admin from coordinators where user_id = '${HELPER_ID}';`]),
    ).toBe("t");

    psql(testDbUrl, [
      "-c",
      `update coordinators set role = 'helper' where user_id = '${HELPER_ID}';`,
    ]);
    expect(
      psql(testDbUrl, [
        "-c",
        `select role || ':' || is_admin::text from coordinators where user_id = '${HELPER_ID}';`,
      ]),
    ).toBe("helper:false");
  });

  it("seeds default role_permissions, validates section names, and protects writes via RLS", () => {
    expect(
      psql(testDbUrl, [
        "-c",
        "select array_length(tabs, 1) from role_permissions where role = 'coordinator';",
      ]),
    ).toBe("11");
    expect(
      psql(testDbUrl, ["-c", "select tabs::text from role_permissions where role = 'helper';"]),
    ).toBe("{messages}");

    // Unknown section names fail the check constraint.
    expect(() =>
      psql(testDbUrl, [
        "-c",
        "update role_permissions set tabs = array['bogus'] where role = 'helper';",
      ]),
    ).toThrow(/role_permissions_tabs_check/);

    // Helpers and coordinators can read role_permissions, anon cannot, and authenticated cannot write.
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        "select tabs::text from role_permissions where role = 'helper';",
        HELPER_ID,
      ),
    ).toBe("{messages}");
    expect(() => psqlAs(testDbUrl, "anon", "select count(*) from role_permissions;")).toThrow(
      /permission denied/,
    );
    expect(() =>
      psqlAs(
        testDbUrl,
        "authenticated",
        "update role_permissions set tabs = array['overview'] where role = 'helper';",
        HELPER_ID,
      ),
    ).toThrow(/permission denied/);
  });
});
