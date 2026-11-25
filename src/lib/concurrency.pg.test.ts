import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  hymnsFingerprint,
  outlineOrdersFingerprint,
  scheduleFingerprint,
  versesFingerprint,
} from "./domain/list-sync";

const DB_URL = process.env.SCRATCH_DB_URL;

const TRAINING_ID = "11111111-1111-4111-8111-111111111111";
const S1_ID = "aaaa1111-1111-4111-8111-111111111111";
const S2_ID = "aaaa2222-2222-4222-8222-222222222222";
const LOC_ID = "bbbb1111-1111-4111-8111-111111111111";
const SITE_ID = "cccc1111-1111-4111-8111-111111111111";
const COORD_USER_ID = "eeee1111-1111-4111-8111-111111111111";

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

describe.skipIf(!DB_URL)("concurrency split timestamps and atomic RPCs", () => {
  const serverUrl = DB_URL ?? "";
  const dbName = `concurrency_rpc_test_${process.pid}_${Date.now()}`;
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
      insert into auth.users (id, email) values ('${COORD_USER_ID}', 'coord@example.test');
      insert into coordinators (user_id, display_name, is_admin) values ('${COORD_USER_ID}', 'Coord One', true);
      insert into trainings (id, slug, title, is_published, fee_cents, outline_price_cents)
      values ('${TRAINING_ID}', '2027-01', '{"de":"T","en":"T","ru":"T"}'::jsonb, true, 7000, 500);
      insert into sessions (id, training_id, message_number, starts_at, ends_at, is_tested, is_online) values
        ('${S1_ID}', '${TRAINING_ID}', 1, '2027-01-12T18:00:00Z', '2027-01-12T20:00:00Z', false, true),
        ('${S2_ID}', '${TRAINING_ID}', 2, '2027-01-15T18:00:00Z', '2027-01-15T20:00:00Z', true, false);
      insert into localities (id, training_id, name, is_home)
      values ('${LOC_ID}', '${TRAINING_ID}', 'Frankfurt am Main', true);
      insert into training_sites (id, training_id, name, sort_order)
      values ('${SITE_ID}', '${TRAINING_ID}', 'Frankfurt am Main', 1);
      `,
    ]);
  }, 30_000);

  afterAll(() => {
    if (!serverUrl) return;
    psql(serverUrl, ["-c", `drop database if exists ${dbName} with (force)`]);
  });

  it("isolates registration details, payment_updated_at, and edit_token_hash updates", () => {
    const regId = psqlAs(
      testDbUrl,
      "service_role",
      `select create_registration(
        '${TRAINING_ID}', 'en', 'hash-init', 'part_time', 'Test', 'User', 'tu@example.test', '', '', 'en', '', true, true,
        array['${S1_ID}'::uuid],
        null, null, '${LOC_ID}', '${SITE_ID}', 'en', null
      );`,
    );

    const [regTs0, payTs0] = psql(testDbUrl, [
      "-c",
      `select updated_at || '|' || payment_updated_at from registrations where id = '${regId}';`,
    ]).split("|");

    // 1. Updating edit_token_hash alone bumps neither timestamp.
    psqlAs(
      testDbUrl,
      "authenticated",
      `update registrations set edit_token_hash = 'hash-rotated' where id = '${regId}';`,
      COORD_USER_ID,
    );
    expect(
      psql(testDbUrl, [
        "-c",
        `select updated_at || '|' || payment_updated_at from registrations where id = '${regId}';`,
      ]),
    ).toBe(`${regTs0}|${payTs0}`);

    // 2. Saving payment with stale payment_updated_at fails; with current it bumps ONLY payment_updated_at.
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_registration_payment(
          '${regId}', '${payTs0}'::timestamptz,
          true, true, 'TX-1', true, false, '', '', array['fee_received'],
          '2027-01-10'::date, null, null
        );`,
        COORD_USER_ID,
      ),
    ).toBe("saved");

    const [regTsAfterPay, payTsAfterPay] = psql(testDbUrl, [
      "-c",
      `select updated_at || '|' || payment_updated_at from registrations where id = '${regId}';`,
    ]).split("|");
    expect(regTsAfterPay).toBe(regTs0);
    expect(payTsAfterPay).not.toBe(payTs0);

    // 3. Coordinator details edit using regTs0 still succeeds even after payment saved, and even when only sessions change!
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_registration(
          '${regId}', 'part_time', 'Test', 'User', 'tu@example.test', '', '', 'en', '', true, true,
          true, array['${S2_ID}'::uuid], '${regTs0}'::timestamptz, null,
          null, null, '${LOC_ID}', '${SITE_ID}', 'en', null
        );`,
        COORD_USER_ID,
      ),
    ).toBe("saved");

    const [regTsAfterEdit, payTsAfterEdit] = psql(testDbUrl, [
      "-c",
      `select updated_at || '|' || payment_updated_at from registrations where id = '${regId}';`,
    ]).split("|");
    expect(regTsAfterEdit).not.toBe(regTs0);
    expect(payTsAfterEdit).toBe(payTsAfterPay);
  });

  it("isolates training_reports details_updated_at from questionnaire saves and checks versions atomically", () => {
    // 1. Questionnaire answer upsert inserts training_reports with details_updated_at = NULL.
    psqlAs(
      testDbUrl,
      "authenticated",
      `insert into training_reports (training_id, tested) values ('${TRAINING_ID}', true);`,
      COORD_USER_ID,
    );
    expect(
      psql(testDbUrl, [
        "-c",
        `select coalesce(details_updated_at::text, 'NULL') from training_reports where training_id = '${TRAINING_ID}';`,
      ]),
    ).toBe("NULL");

    // 2. First details save (rendered before questionnaire was answered, so expected = NULL) still succeeds.
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_report_details('${TRAINING_ID}', 'Initial note', true, '2027-01-12'::date, '2027-01-24'::date, null);`,
        COORD_USER_ID,
      ),
    ).toBe("saved");

    const detailsTs1 = psql(testDbUrl, [
      "-c",
      `select details_updated_at from training_reports where training_id = '${TRAINING_ID}';`,
    ]);
    expect(detailsTs1.length).toBeGreaterThan(0);

    // 3. Another questionnaire answer bumps updated_at, NOT details_updated_at.
    psqlAs(
      testDbUrl,
      "authenticated",
      `insert into training_reports (training_id, in_person) values ('${TRAINING_ID}', true)
       on conflict (training_id) do update set in_person = excluded.in_person;`,
      COORD_USER_ID,
    );
    expect(
      psql(testDbUrl, [
        "-c",
        `select details_updated_at from training_reports where training_id = '${TRAINING_ID}';`,
      ]),
    ).toBe(detailsTs1);

    // 4. Stale details save fails without overwriting; matching save succeeds.
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_report_details('${TRAINING_ID}', 'Stale overwrite', true, null, null, null);`,
        COORD_USER_ID,
      ),
    ).toBe("stale");
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_report_details('${TRAINING_ID}', 'Updated note', true, '2027-01-12'::date, '2027-01-24'::date, '${detailsTs1}'::timestamptz);`,
        COORD_USER_ID,
      ),
    ).toBe("saved");
    expect(
      psql(testDbUrl, [
        "-c",
        `select notes from training_reports where training_id = '${TRAINING_ID}';`,
      ]),
    ).toBe("Updated note");
  });

  it("handles atomic RPCs for outline_orders, schedule, message_hymns, message_verses, and blocks anon", () => {
    // Anon blocked on all 5 new RPCs.
    for (const call of [
      `select save_report_details('${TRAINING_ID}', 'x', false, null, null, null);`,
      `select save_outline_orders('${TRAINING_ID}', 1, 1, 1, null);`,
      `select save_schedule('${TRAINING_ID}', '[]'::jsonb, null);`,
      `select save_message_hymns('${S1_ID}', '[]'::jsonb, null);`,
      `select save_message_verses('${S1_ID}', '[]'::jsonb, null);`,
    ]) {
      expect(() => psqlAs(testDbUrl, "anon", call)).toThrow(/permission denied/);
    }

    // 1. Outline orders: initial fingerprint '0:0:0'
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_outline_orders('${TRAINING_ID}', 10, 20, 5, '${outlineOrdersFingerprint({ de: 1, en: 0, ru: 0 })}');`,
        COORD_USER_ID,
      ),
    ).toBe("stale");
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_outline_orders('${TRAINING_ID}', 10, 20, 5, '${outlineOrdersFingerprint({ de: 0, en: 0, ru: 0 })}');`,
        COORD_USER_ID,
      ),
    ).toBe("saved");
    expect(
      psql(testDbUrl, [
        "-c",
        `select string_agg(language::text || ':' || quantity::text, ',' order by language) from outline_orders where training_id = '${TRAINING_ID}';`,
      ]),
    ).toBe("de:10,en:20,ru:5");

    // 2. Schedule: client fingerprint matches Postgres state jsonb
    const initialScheduleFp = scheduleFingerprint([
      {
        id: S1_ID,
        starts_at: "2027-01-12T18:00:00Z",
        ends_at: "2027-01-12T20:00:00Z",
        is_tested: false,
        is_online: true,
      },
      {
        id: S2_ID,
        starts_at: "2027-01-15T18:00:00Z",
        ends_at: "2027-01-15T20:00:00Z",
        is_tested: true,
        is_online: false,
      },
    ]);
    const schedulePayload = JSON.stringify([
      {
        id: S1_ID,
        starts_at: "2027-01-12T18:30:00.000Z",
        ends_at: "2027-01-12T20:30:00.000Z",
        is_tested: true,
        is_online: false,
      },
      {
        id: S2_ID,
        starts_at: "2027-01-15T18:00:00.000Z",
        ends_at: "2027-01-15T20:00:00.000Z",
        is_tested: false,
        is_online: true,
      },
    ]);
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_schedule('${TRAINING_ID}', '${schedulePayload}'::jsonb, '${initialScheduleFp}'::jsonb);`,
        COORD_USER_ID,
      ),
    ).toBe("saved");
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_schedule('${TRAINING_ID}', '${schedulePayload}'::jsonb, '${initialScheduleFp}'::jsonb);`,
        COORD_USER_ID,
      ),
    ).toBe("stale");
    expect(
      psql(testDbUrl, [
        "-c",
        `select is_tested || '|' || is_online from sessions where id = '${S1_ID}';`,
      ]),
    ).toBe("true|false");

    // 3. Message hymns: empty fingerprint matches '[]', replaces, and rejects stale repeat.
    const emptyHymnsFp = hymnsFingerprint([]);
    const hymns1 = JSON.stringify([
      { en: "501", de: "214", ru: null },
      { en: "300", de: null, ru: "110" },
    ]);
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_message_hymns('${S1_ID}', '${hymns1}'::jsonb, '${emptyHymnsFp}'::jsonb);`,
        COORD_USER_ID,
      ),
    ).toBe("saved");
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_message_hymns('${S1_ID}', '[]'::jsonb, '${emptyHymnsFp}'::jsonb);`,
        COORD_USER_ID,
      ),
    ).toBe("stale");
    expect(
      psql(testDbUrl, ["-c", `select count(*) from message_hymns where session_id = '${S1_ID}';`]),
    ).toBe("2");

    // 4. Message verses: empty fingerprint matches '[]', saves normalized body, rejects stale repeat.
    const emptyVersesFp = versesFingerprint([]);
    const verses1 = JSON.stringify([
      { ref: "Col. 1:27", text: { en: "Christ in you", de: "Christus in euch" } },
    ]);
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_message_verses('${S1_ID}', '${verses1}'::jsonb, '${emptyVersesFp}'::jsonb);`,
        COORD_USER_ID,
      ),
    ).toBe("saved");
    const currentVersesFp = versesFingerprint([
      { ref: "Col. 1:27", text: { en: "Christ in you", de: "Christus in euch" } },
    ]);
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_message_verses('${S1_ID}', '[]'::jsonb, '${emptyVersesFp}'::jsonb);`,
        COORD_USER_ID,
      ),
    ).toBe("stale");
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_message_verses('${S1_ID}', '[]'::jsonb, '${currentVersesFp}'::jsonb);`,
        COORD_USER_ID,
      ),
    ).toBe("saved");
    expect(
      psql(testDbUrl, [
        "-c",
        `select jsonb_array_length(body -> 'verses') from message_verses where session_id = '${S1_ID}';`,
      ]),
    ).toBe("0");
  });
});
