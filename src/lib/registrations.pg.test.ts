import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const DB_URL = process.env.SCRATCH_DB_URL;

const TRAINING_ID = "11111111-1111-4111-8111-111111111111";
const S1_ID = "aaaa1111-1111-4111-8111-111111111111";
const S2_ID = "aaaa2222-2222-4222-8222-222222222222";
const S3_ID = "aaaa3333-3333-4333-8333-333333333333";
const LOC_ID = "bbbb1111-1111-4111-8111-111111111111";
const SITE_ID = "cccc1111-1111-4111-8111-111111111111";
const COORD_USER_ID = "eeee1111-1111-4111-8111-111111111111";

const DE_GROUP_ID = "99991111-1111-4111-8111-111111111111";
const EN_GROUP_FULL_ID = "99992222-2222-4222-8222-222222222222";
const EN_GROUP_SMALL_ID = "99993333-3333-4333-8333-333333333333";
const PEER_REG_1 = "88881111-1111-4111-8111-111111111111";
const PEER_REG_2 = "88882222-2222-4222-8222-222222222222";
const CANCELLED_PEER = "88883333-3333-4333-8333-333333333333";

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

describe.skipIf(!DB_URL)("registration lifecycle postgres RPCs", () => {
  const serverUrl = DB_URL ?? "";
  const dbName = `reg_rpc_test_${process.pid}_${Date.now()}`;
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
      insert into sessions (id, training_id, message_number, starts_at, ends_at) values
        ('${S1_ID}', '${TRAINING_ID}', 1, '2027-01-12T18:00:00Z', '2027-01-12T20:00:00Z'),
        ('${S2_ID}', '${TRAINING_ID}', 2, '2027-01-15T18:00:00Z', '2027-01-15T20:00:00Z'),
        ('${S3_ID}', '${TRAINING_ID}', 3, '2027-01-16T08:30:00Z', '2027-01-16T10:30:00Z');
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

  it("blocks anon execution and handles create_registration atomicity, save_registration parity/groups, payment, and cancel", () => {
    // 1. Anon must not be able to execute any registration lifecycle RPC.
    expect(() =>
      psqlAs(testDbUrl, "anon", `select cancel_registration('${TRAINING_ID}');`),
    ).toThrow(/permission denied/);
    expect(() =>
      psqlAs(
        testDbUrl,
        "anon",
        `select create_registration(
          '${TRAINING_ID}', 'en', 'anon-hash', 'full_time', 'A', 'B', 'a@example.test', '', '', 'en', '', true, true, '{}'::uuid[]
        );`,
      ),
    ).toThrow(/permission denied/);

    // 2. Rollback check on invalid session FK: 0 registration rows left behind.
    expect(() =>
      psqlAs(
        testDbUrl,
        "service_role",
        `select create_registration(
          '${TRAINING_ID}', 'en', 'bad-session-hash', 'part_time', 'Test', 'Rollback', 'rb@example.test', '', '', 'en', '', true, true,
          array['ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid],
          null, null, '${LOC_ID}', '${SITE_ID}', 'en', null
        );`,
      ),
    ).toThrow(/registration_sessions_session_id_fkey/);
    expect(
      psql(testDbUrl, [
        "-c",
        "select count(*) from registrations where email = 'rb@example.test';",
      ]),
    ).toBe("0");

    // 3. Valid create_registration deduplicates session ids and creates row + sessions atomically.
    const regId = psqlAs(
      testDbUrl,
      "service_role",
      `select create_registration(
        '${TRAINING_ID}', 'en', 'tok-hash-1', 'part_time', 'Test', 'One', 't1@example.test', '', '', 'de', 'note', true, true,
        array['${S1_ID}'::uuid, '${S1_ID}'::uuid, '${S2_ID}'::uuid],
        null, null, '${LOC_ID}', '${SITE_ID}', 'de', null
      );`,
    );
    expect(regId).toMatch(/^[0-9a-f-]{36}$/);
    expect(
      psql(testDbUrl, [
        "-c",
        `select count(*) from registration_sessions where registration_id = '${regId}';`,
      ]),
    ).toBe("2");

    const updatedAt = psql(testDbUrl, [
      "-c",
      `select updated_at from registrations where id = '${regId}';`,
    ]);

    // 4. Stale check leaves registration, sessions, and events unchanged.
    const staleResult = psqlAs(
      testDbUrl,
      "service_role",
      `select save_registration(
        '${regId}', 'full_time', 'Should', 'Fail', 't1@example.test', '', '', 'en', '', true, true,
        true, '{}'::uuid[], '2020-01-01T00:00:00Z'::timestamptz, 'de',
        null, null, '${LOC_ID}', '${SITE_ID}', 'en', null
      );`,
    );
    expect(staleResult).toBe("stale");
    expect(
      psql(testDbUrl, [
        "-c",
        `select count(*) from registration_events where registration_id = '${regId}';`,
      ]),
    ).toBe("0");

    // 5. Locked self-edit preserves existing sessions (p_replace_sessions = false) and records unnamed self-edit.
    const selfSave = psqlAs(
      testDbUrl,
      "service_role",
      `select save_registration(
        '${regId}', 'part_time', 'Test', 'Edited', 't1@example.test', '555', '', 'de', 'updated', true, true,
        false, '{}'::uuid[], '${updatedAt}'::timestamptz, 'de',
        null, null, '${LOC_ID}', '${SITE_ID}', 'de', null
      );`,
    );
    expect(selfSave).toBe("saved");
    expect(
      psql(testDbUrl, [
        "-c",
        `select last_name || '|' || phone from registrations where id = '${regId}';`,
      ]),
    ).toBe("Edited|555");
    expect(
      psql(testDbUrl, [
        "-c",
        `select count(*) from registration_sessions where registration_id = '${regId}';`,
      ]),
    ).toBe("2");
    expect(
      psql(testDbUrl, [
        "-c",
        `select kind || '|' || coalesce(actor_id::text, 'null') || '|' || actor_name from registration_events where registration_id = '${regId}';`,
      ]),
    ).toBe("edited|null|");

    // 6. Seed study groups and test coordinator edits (derived actor identity + study-group sync).
    psql(testDbUrl, [
      "-c",
      `
      insert into registrations (id, training_id, locale, edit_token_hash, seat_type, first_name, last_name, email, group_language, outline_language, locality_id, site_id, confirmed_adult, accepted_rules, status) values
        ('${PEER_REG_1}', '${TRAINING_ID}', 'en', 'peer-1', 'full_time', 'Peer', 'One', 'p1@example.test', 'en', 'en', '${LOC_ID}', '${SITE_ID}', true, true, 'active'),
        ('${PEER_REG_2}', '${TRAINING_ID}', 'en', 'peer-2', 'full_time', 'Peer', 'Two', 'p2@example.test', 'en', 'en', '${LOC_ID}', '${SITE_ID}', true, true, 'active'),
        ('${CANCELLED_PEER}', '${TRAINING_ID}', 'en', 'peer-3', 'full_time', 'Peer', 'Three', 'p3@example.test', 'en', 'en', '${LOC_ID}', '${SITE_ID}', true, true, 'cancelled');
      insert into study_groups (id, training_id, name, language, sort_order) values
        ('${DE_GROUP_ID}', '${TRAINING_ID}', '1', 'de', 1),
        ('${EN_GROUP_FULL_ID}', '${TRAINING_ID}', '2', 'en', 2),
        ('${EN_GROUP_SMALL_ID}', '${TRAINING_ID}', '3', 'en', 3);
      insert into study_group_members (group_id, registration_id) values
        ('${DE_GROUP_ID}', '${regId}'),
        ('${EN_GROUP_FULL_ID}', '${PEER_REG_1}'),
        ('${EN_GROUP_FULL_ID}', '${PEER_REG_2}'),
        ('${EN_GROUP_SMALL_ID}', '${CANCELLED_PEER}');
      `,
    ]);

    const coordTs1 = psql(testDbUrl, [
      "-c",
      `select updated_at from registrations where id = '${regId}';`,
    ]);
    const moveToEn = psqlAs(
      testDbUrl,
      "authenticated",
      `select save_registration(
        '${regId}', 'full_time', 'Test', 'Edited', 't1@example.test', '555', '', 'en', 'updated', true, true,
        true, '{}'::uuid[], '${coordTs1}'::timestamptz, null,
        null, null, '${LOC_ID}', '${SITE_ID}', 'en', null
      );`,
      COORD_USER_ID,
    );
    expect(moveToEn).toBe("saved");
    expect(
      psql(testDbUrl, [
        "-c",
        `select group_id from study_group_members where registration_id = '${regId}';`,
      ]),
    ).toBe(EN_GROUP_SMALL_ID);
    expect(psql(testDbUrl, ["-c", `select locale from registrations where id = '${regId}';`])).toBe(
      "de",
    );
    expect(
      psql(testDbUrl, [
        "-c",
        `select count(*) from registration_sessions where registration_id = '${regId}';`,
      ]),
    ).toBe("0");
    expect(
      psql(testDbUrl, [
        "-c",
        `select actor_id::text || '|' || actor_name from registration_events where registration_id = '${regId}' order by created_at desc, id desc limit 1;`,
      ]),
    ).toBe(`${COORD_USER_ID}|Coord One`);

    // Keeping group_language = 'en' preserves a manual group assignment.
    psql(testDbUrl, [
      "-c",
      `update study_group_members set group_id = '${EN_GROUP_FULL_ID}' where registration_id = '${regId}';`,
    ]);
    const coordTs2 = psql(testDbUrl, [
      "-c",
      `select updated_at from registrations where id = '${regId}';`,
    ]);
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_registration(
          '${regId}', 'part_time', 'Test', 'ManualKeep', 't1@example.test', '555', '', 'en', 'updated', true, true,
          true, array['${S3_ID}'::uuid], '${coordTs2}'::timestamptz, null,
          null, null, '${LOC_ID}', '${SITE_ID}', 'en', null
        );`,
        COORD_USER_ID,
      ),
    ).toBe("saved");
    expect(
      psql(testDbUrl, [
        "-c",
        `select group_id from study_group_members where registration_id = '${regId}';`,
      ]),
    ).toBe(EN_GROUP_FULL_ID);

    // Switching EN -> RU creates a new RU study group with sort_order 4 and moves registrant there.
    const coordTs3 = psql(testDbUrl, [
      "-c",
      `select updated_at from registrations where id = '${regId}';`,
    ]);
    expect(
      psqlAs(
        testDbUrl,
        "service_role",
        `select save_registration(
          '${regId}', 'part_time', 'Test', 'RuGroup', 't1@example.test', '555', '', 'ru', 'updated', true, true,
          false, '{}'::uuid[], '${coordTs3}'::timestamptz, 'ru',
          null, null, '${LOC_ID}', '${SITE_ID}', 'en', null
        );`,
      ),
    ).toBe("saved");
    expect(
      psql(testDbUrl, [
        "-c",
        `select sg.language || ':' || sg.sort_order from study_group_members m join study_groups sg on sg.id = m.group_id where m.registration_id = '${regId}';`,
      ]),
    ).toBe("ru:4");

    // 7. Payment save atomicity + stale rejection as authenticated coordinator (uses split payment_updated_at).
    const beforePayRegTs = psql(testDbUrl, [
      "-c",
      `select updated_at from registrations where id = '${regId}';`,
    ]);
    const payTs = psql(testDbUrl, [
      "-c",
      `select payment_updated_at from registrations where id = '${regId}';`,
    ]);
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_registration_payment(
          '${regId}', '2020-01-01T00:00:00Z'::timestamptz,
          true, true, 'STALE-TX', false, false, '', '', array['fee_received'],
          '2027-01-10'::date, null, null
        );`,
        COORD_USER_ID,
      ),
    ).toBe("stale");
    expect(
      psql(testDbUrl, ["-c", `select fee_paid from registrations where id = '${regId}';`]),
    ).toBe("f");

    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_registration_payment(
          '${regId}', '${payTs}'::timestamptz,
          true, true, 'BANK-OK', true, false, '', 'Hardship note', array['fee_received', 'waiver_set'],
          '2027-01-10'::date, null, 'hardship'::fee_waiver
        );`,
        COORD_USER_ID,
      ),
    ).toBe("saved");
    expect(
      psql(testDbUrl, [
        "-c",
        `select fee_paid || '|' || fee_transaction || '|' || waiver::text from registrations where id = '${regId}';`,
      ]),
    ).toBe("true|BANK-OK|hardship");
    expect(
      psql(testDbUrl, ["-c", `select updated_at from registrations where id = '${regId}';`]),
    ).toBe(beforePayRegTs);

    // 7b. Waived seat (p_update_fee = false) preserves existing fee columns while updating outlines.
    const payTs2 = psql(testDbUrl, [
      "-c",
      `select payment_updated_at from registrations where id = '${regId}';`,
    ]);
    expect(payTs2).not.toBe(payTs);
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_registration_payment(
          '${regId}', '${payTs2}'::timestamptz,
          false, false, '', true, true, 'OUT-OK', 'Hardship note', array['outline_received'],
          null, '2027-01-11'::date, 'hardship'::fee_waiver
        );`,
        COORD_USER_ID,
      ),
    ).toBe("saved");
    expect(
      psql(testDbUrl, [
        "-c",
        `select fee_paid || '|' || fee_transaction || '|' || outline_paid || '|' || outline_transaction from registrations where id = '${regId}';`,
      ]),
    ).toBe("true|BANK-OK|true|OUT-OK");

    // 7c. Non-coordinator authenticated user cannot mutate via save_registration.
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select save_registration(
          '${regId}', 'full_time', 'Intruder', 'X', 'x@example.test', '', '', 'en', '', true, true,
          false, '{}'::uuid[], '${payTs2}'::timestamptz, null,
          null, null, '${LOC_ID}', '${SITE_ID}', 'en', null
        );`,
        "77771111-1111-4111-8111-111111111111",
      ),
    ).toBe("not_found");

    // 8. Cancellation removes study_group_members, sets cancelled_at, records coordinator-attributed cancelled event, and second call returns not_found.
    expect(
      psqlAs(testDbUrl, "authenticated", `select cancel_registration('${regId}');`, COORD_USER_ID),
    ).toBe("cancelled");
    expect(
      psql(testDbUrl, [
        "-c",
        `select count(*) from study_group_members where registration_id = '${regId}';`,
      ]),
    ).toBe("0");
    expect(psql(testDbUrl, ["-c", `select cancel_registration('${regId}');`])).toBe("not_found");
    expect(
      psql(testDbUrl, [
        "-c",
        `select count(*) || '|' || min(actor_id::text) || '|' || min(actor_name) from registration_events where registration_id = '${regId}' and kind = 'cancelled';`,
      ]),
    ).toBe(`1|${COORD_USER_ID}|Coord One`);
    // 9. replace_study_groups with site_id keeps Mannheim/Heidelberg isolated from Frankfurt in sync_registration_study_group.
    const mhSiteId = "cccc2222-2222-4222-8222-222222222222";
    const mhRegId = "88884444-4444-4444-8444-444444444444";
    psql(testDbUrl, [
      "-c",
      `
      insert into training_sites (id, training_id, name, sort_order)
      values ('${mhSiteId}', '${TRAINING_ID}', 'Mannheim/Heidelberg', 2);
      insert into registrations (id, training_id, locale, edit_token_hash, seat_type, first_name, last_name, email, group_language, outline_language, locality_id, site_id, confirmed_adult, accepted_rules, status)
      values ('${mhRegId}', '${TRAINING_ID}', 'en', 'mh-1', 'full_time', 'Alice', 'Meyer', 'mh1@example.test', 'de', 'de', '${LOC_ID}', '${mhSiteId}', true, true, 'active');
      `,
    ]);
    psqlAs(
      testDbUrl,
      "authenticated",
      `select replace_study_groups('${TRAINING_ID}', $json$[
        {"language": "de", "site_id": null, "members": ["${PEER_REG_1}"]},
        {"language": "en", "site_id": "${mhSiteId}", "members": []}
      ]$json$::jsonb);`,
      COORD_USER_ID,
    );
    psqlAs(
      testDbUrl,
      "authenticated",
      `select sync_registration_study_group('${mhRegId}', '${TRAINING_ID}', 'de');`,
      COORD_USER_ID,
    );
    expect(
      psql(testDbUrl, [
        "-c",
        `select coalesce(sg.site_id::text, 'null') || '|' || sg.language from study_group_members m join study_groups sg on sg.id = m.group_id where m.registration_id = '${mhRegId}';`,
      ]),
    ).toBe(`${mhSiteId}|en`);

    // 10. Atomic move_study_group_member and delete_empty_study_group respect active membership under lock.
    const emptyGroupId = psql(testDbUrl, [
      "-c",
      `insert into study_groups (training_id, name, language, sort_order) values ('${TRAINING_ID}', '99', 'en', 99) returning id;`,
    ]);
    const occupiedGroupId = psql(testDbUrl, [
      "-c",
      `select id from study_groups where training_id = '${TRAINING_ID}' and sort_order = 1;`,
    ]);
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select delete_empty_study_group('${TRAINING_ID}', '${occupiedGroupId}');`,
        COORD_USER_ID,
      ),
    ).toBe("not_empty");
    psqlAs(
      testDbUrl,
      "authenticated",
      `select move_study_group_member('${PEER_REG_1}', '${emptyGroupId}');`,
      COORD_USER_ID,
    );
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select delete_empty_study_group('${TRAINING_ID}', '${emptyGroupId}');`,
        COORD_USER_ID,
      ),
    ).toBe("not_empty");
    expect(
      psqlAs(
        testDbUrl,
        "authenticated",
        `select delete_empty_study_group('${TRAINING_ID}', '${occupiedGroupId}');`,
        COORD_USER_ID,
      ),
    ).toBe("deleted");
  }, 30_000);
});
