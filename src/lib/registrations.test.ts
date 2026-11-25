import { describe, expect, it } from "vitest";

import type { TrainingWithSessions } from "@/lib/data";

import {
  createRegistrationLifecycle,
  parsePaymentForm,
  parseRegistrationForm,
  validateForTraining,
  type LockedSeat,
  type RegistrationLifecycleDeps,
  type RegistrationStore,
  type StoredRegistrationRecord,
} from "./registrations";

const TRAINING_ID = "11111111-1111-4111-8111-111111111111";
const S1_ID = "aaaa1111-1111-4111-8111-111111111111";
const S2_ID = "aaaa2222-2222-4222-8222-222222222222";
const S3_ID = "aaaa3333-3333-4333-8333-333333333333";
const LOC_FRANKFURT = "bbbb1111-1111-4111-8111-111111111111";
const LOC_MANNHEIM = "bbbb2222-2222-4222-8222-222222222222";
const SITE_FRANKFURT = "cccc1111-1111-4111-8111-111111111111";
const SITE_HD = "cccc2222-2222-4222-8222-222222222222";
const REG_ID = "dddd1111-1111-4111-8111-111111111111";

const TRAINING: TrainingWithSessions = {
  id: TRAINING_ID,
  slug: "2027-01",
  title: { de: "Training DE", en: "Training EN", ru: "Training RU" },
  fee_cents: 7000,
  outline_price_cents: 500,
  payee_name: "Test Church",
  payee_iban: "DE00123456780000000000",
  payment_reference: "VT-2027-01",
  venue: "Test Street 1",
  rules: {},
  sessions: [
    {
      id: S1_ID,
      message_number: 1,
      starts_at: "2027-01-12T18:00:00.000Z",
      ends_at: "2027-01-12T20:00:00.000Z",
      is_online: true,
    },
    {
      id: S2_ID,
      message_number: 2,
      starts_at: "2027-01-15T18:00:00.000Z",
      ends_at: "2027-01-15T20:00:00.000Z",
      is_online: true,
    },
    {
      id: S3_ID,
      message_number: 3,
      starts_at: "2027-01-16T08:30:00.000Z",
      ends_at: "2027-01-16T10:30:00.000Z",
      is_online: false,
    },
  ],
  localities: [
    { id: LOC_FRANKFURT, name: "Frankfurt am Main", is_home: true },
    { id: LOC_MANNHEIM, name: "Mannheim", is_home: false },
  ],
  sites: [
    { id: SITE_FRANKFURT, name: "Frankfurt am Main" },
    { id: SITE_HD, name: "Mannheim/Heidelberg" },
  ],
};

function makeForm(fields: Record<string, string | string[]>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const item of value) form.append(key, item);
    } else {
      form.set(key, value);
    }
  }
  return form;
}

function validPublicFields(overrides: Record<string, string | string[]> = {}): FormData {
  return makeForm({
    seat_type: "full_time",
    first_name: "Test",
    last_name: "Person",
    email: "Test.Person@Example.Test ",
    phone: "+491234",
    locality: LOC_FRANKFURT,
    site_id: SITE_FRANKFURT,
    group_language: "en",
    outline_language: "en",
    second_outline_language: "",
    comments: "hello",
    confirmed_adult: "on",
    accepted_rules: "on",
    ...overrides,
  });
}

function storedRecord(overrides: Partial<StoredRegistrationRecord> = {}): StoredRegistrationRecord {
  return {
    id: REG_ID,
    training_id: TRAINING_ID,
    status: "active",
    seat_type: "part_time",
    first_name: "Test",
    last_name: "Person",
    partner_first_name: null,
    partner_last_name: null,
    email: "test.person@example.test",
    locale: "en",
    group_language: "en",
    outline_language: "de",
    second_outline_language: null,
    locality_id: LOC_FRANKFURT,
    other_locality: "",
    site_id: SITE_FRANKFURT,
    waiver: null,
    waiver_reason: "",
    fee_paid: false,
    fee_paid_on: null,
    fee_transaction: "",
    outline_paid: false,
    outline_paid_on: null,
    outline_transaction: "",
    updated_at: "2027-01-01T10:00:00.000Z",
    registration_sessions: [{ session_id: S1_ID }],
    ...overrides,
  };
}

type FakeClient = { tag: "fake-coordinator" };
const FAKE_CLIENT: FakeClient = { tag: "fake-coordinator" };

function makeHarness(
  options: {
    now?: Date;
    isBot?: boolean;
    training?: TrainingWithSessions | null;
    duplicate?: boolean;
    byToken?: StoredRegistrationRecord | null;
    byCoordinator?: StoredRegistrationRecord | null;
    saveResult?: "saved" | "stale" | "not_found";
    cancelResult?: "cancelled" | "not_found";
    paymentResult?: "saved" | "stale" | "not_found";
    groupPlaceError?: Error;
    sendConfirmationError?: Error;
  } = {},
) {
  const created: Parameters<RegistrationStore<FakeClient>["createRegistration"]>[0][] = [];
  const placed: Parameters<RegistrationStore<FakeClient>["placeInStudyGroup"]>[0][] = [];
  const saved: Parameters<RegistrationStore<FakeClient>["saveRegistration"]>[0][] = [];
  const cancelled: Parameters<RegistrationStore<FakeClient>["cancelRegistration"]>[0][] = [];
  const payments: Parameters<RegistrationStore<FakeClient>["savePayment"]>[0][] = [];
  const replacedTokens: Parameters<RegistrationStore<FakeClient>["replaceEditToken"]>[0][] = [];
  const confirmations: Parameters<
    RegistrationLifecycleDeps<FakeClient>["mail"]["sendConfirmation"]
  >[0][] = [];
  const cancellations: Parameters<
    RegistrationLifecycleDeps<FakeClient>["mail"]["sendCancellation"]
  >[0][] = [];
  const groupErrors: unknown[] = [];
  const calls = {
    created,
    placed,
    saved,
    cancelled,
    payments,
    replacedTokens,
    confirmations,
    cancellations,
    groupErrors,
    trainingLookups: 0,
  };

  const store: RegistrationStore<FakeClient> = {
    getPublishedTraining() {
      calls.trainingLookups += 1;
      return Promise.resolve(options.training === undefined ? TRAINING : options.training);
    },
    getTrainingById() {
      return Promise.resolve(TRAINING);
    },
    findByToken() {
      return Promise.resolve(options.byToken === undefined ? storedRecord() : options.byToken);
    },
    findForCoordinator() {
      return Promise.resolve(
        options.byCoordinator === undefined ? storedRecord() : options.byCoordinator,
      );
    },
    hasPossibleDuplicate() {
      return Promise.resolve(options.duplicate ?? false);
    },
    createRegistration(args) {
      created.push(args);
      return Promise.resolve(REG_ID);
    },
    placeInStudyGroup(args) {
      placed.push(args);
      if (options.groupPlaceError) return Promise.reject(options.groupPlaceError);
      return Promise.resolve();
    },
    saveRegistration(args) {
      saved.push(args);
      return Promise.resolve(options.saveResult ?? "saved");
    },
    cancelRegistration(args) {
      cancelled.push(args);
      return Promise.resolve(options.cancelResult ?? "cancelled");
    },
    savePayment(args) {
      payments.push(args);
      return Promise.resolve(options.paymentResult ?? "saved");
    },
    replaceEditToken(args) {
      replacedTokens.push(args);
      return Promise.resolve();
    },
  };

  const lifecycle = createRegistrationLifecycle({
    checkBot: () => Promise.resolve({ isBot: options.isBot ?? false }),
    now: () => options.now ?? new Date("2027-01-10T12:00:00.000Z"),
    newToken: () => ({ token: "tok-plain", hash: "tok-hash" }),
    calendarUrl: (locale, token) => `/${locale}/training/r/${token}/calendar.ics`,
    mail: {
      sendConfirmation(args) {
        confirmations.push(args);
        if (options.sendConfirmationError) return Promise.reject(options.sendConfirmationError);
        return Promise.resolve();
      },
      sendCancellation(args) {
        cancellations.push(args);
        return Promise.resolve();
      },
    },
    onGroupPlaceError(error) {
      groupErrors.push(error);
    },
    store,
  });

  return { lifecycle, calls };
}

describe("parseRegistrationForm & validateForTraining", () => {
  it("keeps FormData immutable and preserves locked seat, sessions, and partner names", () => {
    const form = validPublicFields({
      seat_type: "full_time",
      session_ids: [S3_ID],
      partner_first_name: "Tampered",
      partner_last_name: "Partner",
      group_language: "ru",
      comments: "updated note",
    });
    const locked: LockedSeat = {
      seat_type: "shared",
      session_ids: [],
      partner_first_name: "Locked",
      partner_last_name: "Spouse",
    };

    const parsed = parseRegistrationForm(form, locked);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.seat_type).toBe("shared");
    expect(parsed.data.partner_first_name).toBe("Locked");
    expect(parsed.data.partner_last_name).toBe("Spouse");
    expect(parsed.data.session_ids).toEqual([]);
    expect(parsed.data.group_language).toBe("ru");
    expect(parsed.data.comments).toBe("updated note");

    // Verify original FormData was never mutated.
    expect(form.get("seat_type")).toBe("full_time");
    expect(form.getAll("session_ids")).toEqual([S3_ID]);
    expect(form.get("partner_first_name")).toBe("Tampered");
  });

  it("deduplicates part-time session ids against training sessions", () => {
    const form = validPublicFields({
      seat_type: "part_time",
      session_ids: [S1_ID, S1_ID, S2_ID],
    });
    const parsed = parseRegistrationForm(form);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const validated = validateForTraining(parsed.data, TRAINING);
    expect(validated?.session_ids).toEqual([S1_ID, S2_ID]);
  });

  it("parses payment forms cleanly including blank optional fields", () => {
    const parsed = parsePaymentForm(
      makeForm({
        fee_paid: "on",
        fee_paid_on: "",
        fee_transaction: " TX-1 ",
        outline_paid_on: "",
        outline_transaction: "",
        waiver: "",
        waiver_reason: "",
        version: "2027-01-01T10:00:00.000Z",
      }),
    );
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.fee_paid).toBe("on");
    expect(parsed.data.fee_paid_on).toBeNull();
    expect(parsed.data.fee_transaction).toBe("TX-1");
    expect(parsed.data.waiver).toBeNull();
  });
});

describe("createRegistrationLifecycle", () => {
  it("stops bots before hitting the training lookup", async () => {
    const { lifecycle, calls } = makeHarness({ isBot: true });
    const res = await lifecycle.registerPublic("en", validPublicFields());
    expect(res).toEqual({ status: "error" });
    expect(calls.trainingLookups).toBe(0);
  });

  it("returns closed after the first training day in Berlin", async () => {
    const { lifecycle } = makeHarness({ now: new Date("2027-01-13T00:00:00.000Z") });
    const res = await lifecycle.registerPublic("en", validPublicFields());
    expect(res).toEqual({ status: "closed" });
  });

  it("warns on possible duplicate until confirm_duplicate is checked", async () => {
    const { lifecycle, calls } = makeHarness({ duplicate: true });
    const first = await lifecycle.registerPublic("en", validPublicFields());
    expect(first).toEqual({ status: "duplicate" });
    expect(calls.created).toHaveLength(0);

    const confirmed = await lifecycle.registerPublic(
      "de",
      validPublicFields({ confirm_duplicate: "on" }),
    );
    expect(confirmed).toEqual({
      status: "done",
      calendarUrl: "/de/training/r/tok-plain/calendar.ics",
    });
    expect(calls.created).toHaveLength(1);
    expect(calls.confirmations).toHaveLength(1);
  });

  it("still succeeds and emails confirmation when study-group placement fails", async () => {
    const { lifecycle, calls } = makeHarness({ groupPlaceError: new Error("no room") });
    const res = await lifecycle.registerPublic("en", validPublicFields());
    expect(res).toEqual({ status: "done", calendarUrl: "/en/training/r/tok-plain/calendar.ics" });
    expect(calls.groupErrors).toHaveLength(1);
    expect(calls.confirmations).toHaveLength(1);
  });

  it("enforces version, cutoff lock, and stale handling on self-service update", async () => {
    const { lifecycle: missingVersion, calls: missingCalls } = makeHarness();
    expect(await missingVersion.updateByToken("t", "en", validPublicFields())).toEqual({
      status: "error",
    });
    expect(missingCalls.saved).toHaveLength(0);

    // After session 1 has started (2027-01-12T18:00Z): seat & sessions locked.
    const { lifecycle: lockedAfterStart, calls: lockedCalls } = makeHarness({
      now: new Date("2027-01-12T18:30:00.000Z"),
      byToken: storedRecord({
        seat_type: "part_time",
        registration_sessions: [{ session_id: S2_ID }],
        waiver: "hardship",
      }),
    });
    const res = await lockedAfterStart.updateByToken(
      "tok-1",
      "de",
      validPublicFields({
        seat_type: "full_time",
        group_language: "de",
        version: "2027-01-01T10:00:00.000Z",
      }),
    );
    expect(res).toEqual({ status: "saved" });
    expect(lockedCalls.saved[0]?.replaceSessions).toBe(false);
    expect(lockedCalls.saved[0]?.input.seat_type).toBe("part_time");
    expect(lockedCalls.saved[0]?.input.session_ids).toEqual([S2_ID]);
    expect(lockedCalls.confirmations[0]?.registration.waived).toBe(true);

    // Stale concurrency conflict returns stale and skips email.
    const { lifecycle: staleEdit, calls: staleCalls } = makeHarness({ saveResult: "stale" });
    expect(
      await staleEdit.updateByToken(
        "tok-1",
        "en",
        validPublicFields({ version: "2027-01-01T09:00:00.000Z" }),
      ),
    ).toEqual({ status: "stale" });
    expect(staleCalls.confirmations).toHaveLength(0);
  });

  it("locks self-cancel after start, handles concurrent cancel, and emails on cancel", async () => {
    const { lifecycle: afterStart } = makeHarness({ now: new Date("2027-01-12T18:00:00.000Z") });
    expect(await afterStart.cancelByToken("tok-1", "en")).toEqual({ status: "locked" });

    const { lifecycle: raceCancel, calls: raceCalls } = makeHarness({ cancelResult: "not_found" });
    expect(await raceCancel.cancelByToken("tok-1", "en")).toEqual({ status: "error" });
    expect(raceCalls.cancellations).toHaveLength(0);

    const { lifecycle: okCancel, calls: okCalls } = makeHarness();
    expect(await okCancel.cancelByToken("tok-1", "ru")).toEqual({ status: "cancelled" });
    expect(okCalls.cancelled).toHaveLength(1);
    expect(okCalls.cancellations).toHaveLength(1);
  });

  it("handles coordinator update without emailing, preserving registrant locale", async () => {
    const { lifecycle, calls } = makeHarness({ saveResult: "saved" });
    const res = await lifecycle.coordinatorUpdateRegistration(
      FAKE_CLIENT,
      REG_ID,
      validPublicFields({ version: "2027-01-01T10:00:00.000Z", group_language: "de" }),
    );
    expect(res).toEqual({ status: "saved" });
    expect(calls.saved[0]?.client).toBe(FAKE_CLIENT);
    expect(calls.saved[0]?.locale).toBeNull();
    expect(calls.saved[0]?.replaceSessions).toBe(true);
    expect(calls.confirmations).toHaveLength(0);
  });

  it("emails cancellation in registrant locale on coordinator cancel", async () => {
    const { lifecycle, calls } = makeHarness({
      byCoordinator: storedRecord({ locale: "ru", email: "ru@example.test", first_name: "Ivan" }),
    });
    expect(await lifecycle.coordinatorCancelRegistration(FAKE_CLIENT, REG_ID)).toEqual({
      status: "cancelled",
    });
    expect(calls.cancelled[0]?.client).toBe(FAKE_CLIENT);
    expect(calls.cancellations[0]?.locale).toBe("ru");
    expect(calls.cancellations[0]?.email).toBe("ru@example.test");
  });

  it("computes payment plan in Berlin time and respects stale checks", async () => {
    // 2027-01-12T23:30:00Z is already 2027-01-13 in Europe/Berlin (UTC+1).
    const { lifecycle, calls } = makeHarness({
      now: new Date("2027-01-12T23:30:00.000Z"),
      paymentResult: "saved",
    });
    const res = await lifecycle.coordinatorSavePayment(
      FAKE_CLIENT,
      REG_ID,
      makeForm({
        fee_paid: "on",
        fee_paid_on: "",
        fee_transaction: "TX-BERLIN",
        outline_paid_on: "",
        outline_transaction: "",
        waiver: "",
        waiver_reason: "",
        version: "2027-01-01T10:00:00.000Z",
      }),
    );
    expect(res).toEqual({ status: "saved" });
    expect(calls.payments[0]?.plan.fee?.paidOn).toBe("2027-01-13");
    expect(calls.payments[0]?.plan.events).toEqual(["fee_received"]);

    const { lifecycle: stalePayment } = makeHarness({ paymentResult: "stale" });
    expect(
      await stalePayment.coordinatorSavePayment(
        FAKE_CLIENT,
        REG_ID,
        makeForm({
          waiver: "",
          waiver_reason: "",
          version: "2027-01-01T09:00:00.000Z",
        }),
      ),
    ).toEqual({ status: "stale" });
  });

  it("sends edit link email before overwriting edit_token_hash", async () => {
    const { lifecycle: failingMail, calls: failCalls } = makeHarness({
      sendConfirmationError: new Error("smtp down"),
    });
    await expect(
      failingMail.coordinatorSendEditLink(FAKE_CLIENT, "Coord One", REG_ID),
    ).rejects.toThrow("smtp down");
    expect(failCalls.replacedTokens).toHaveLength(0);

    const { lifecycle: okMail, calls: okCalls } = makeHarness();
    expect(await okMail.coordinatorSendEditLink(FAKE_CLIENT, "Coord One", REG_ID)).toEqual({
      status: "saved",
    });
    expect(okCalls.confirmations).toHaveLength(1);
    expect(okCalls.replacedTokens[0]?.editTokenHash).toBe("tok-hash");
    expect(okCalls.replacedTokens[0]?.actorName).toBe("Coord One");
  });
});
