import { describe, expect, it } from "vitest";

import type { TrainingWithSessions } from "@/lib/data";
import type { Recipient } from "@/lib/emails";

import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import ru from "../../../messages/ru.json";
import {
  canonicalBeforeTrainingSubject,
  canonicalReminderSubject,
  composeBeforeTraining,
  composeCancellation,
  composeConfirmation,
  composeCoordinatorMessage,
  composePaymentReminder,
  type ConfirmationRegistration,
} from "./compose";
import {
  BATCH_LIMIT,
  createEmailDelivery,
  deterministicIdempotencyKey,
  MAX_IDEMPOTENCY_KEY_LENGTH,
  validateMailMessage,
  type MailMessage,
  type MailTransport,
} from "./transport";

const TRAINING: TrainingWithSessions = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "2027-01",
  title: {
    de: "Videotraining Januar 2027",
    en: "Video Training January 2027",
    ru: "Видеотренинг январь 2027",
  },
  fee_cents: 7000,
  outline_price_cents: 500,
  payee_name: "Gemeinde in Frankfurt",
  payee_iban: "DE00123456780000000000",
  payment_reference: "VT-2027-01",
  venue: "Musterstraße 10, Frankfurt",
  rules: {},
  sessions: [
    {
      id: "aaaa1111-1111-4111-8111-111111111111",
      message_number: 1,
      starts_at: "2027-01-12T18:00:00.000Z",
      ends_at: "2027-01-12T20:00:00.000Z",
    },
    {
      id: "aaaa2222-2222-4222-8222-222222222222",
      message_number: 2,
      starts_at: "2027-01-15T18:00:00.000Z",
      ends_at: "2027-01-15T20:00:00.000Z",
    },
    {
      id: "aaaa3333-3333-4333-8333-333333333333",
      message_number: 3,
      starts_at: "2027-01-16T08:30:00.000Z",
      ends_at: "2027-01-16T10:30:00.000Z",
    },
  ],
  localities: [
    { id: "bbbb1111-1111-4111-8111-111111111111", name: "Frankfurt am Main", is_home: true },
  ],
  sites: [
    { id: "cccc1111-1111-4111-8111-111111111111", name: "Frankfurt am Main" },
    { id: "cccc2222-2222-4222-8222-222222222222", name: "Mannheim/Heidelberg" },
  ],
};

function makeRecordingTransport(
  opts: { failSingle?: string; failBatchAtCall?: number } = {},
): MailTransport & {
  singles: MailMessage[];
  batches: { messages: readonly MailMessage[]; idempotencyKey: string }[];
} {
  const singles: MailMessage[] = [];
  const batches: { messages: readonly MailMessage[]; idempotencyKey: string }[] = [];
  let batchCall = 0;
  return {
    singles,
    batches,
    send(message) {
      singles.push(message);
      return Promise.resolve({ error: opts.failSingle ? new Error(opts.failSingle) : null });
    },
    sendBatch(messages, idempotencyKey) {
      batchCall += 1;
      batches.push({ messages, idempotencyKey });
      if (opts.failBatchAtCall === batchCall) {
        return Promise.resolve({ error: new Error(`Batch ${batchCall} failed`) });
      }
      return Promise.resolve({ error: null });
    },
  };
}

function makeMessage(index: number): MailMessage {
  return {
    to: `delivered+u${index}@resend.dev`,
    subject: `Subject ${index}`,
    text: `Body ${index}`,
  };
}

describe("email validation & delivery", () => {
  it("validates single messages and rejects invalid payloads before transport", async () => {
    const transport = makeRecordingTransport();
    const delivery = createEmailDelivery(transport);

    expect(validateMailMessage({ to: "not-an-email", subject: "Hi", text: "Hello" })).toBe(
      "invalid recipient email",
    );
    expect(validateMailMessage({ to: "user@example.test", subject: "   ", text: "Hello" })).toBe(
      "empty subject",
    );
    expect(validateMailMessage({ to: "user@example.test", subject: "Hi", text: "" })).toBe(
      "empty text body",
    );
    expect(
      validateMailMessage({
        to: "user@example.test",
        subject: "Hi",
        text: "Hello",
        idempotencyKey: "x".repeat(MAX_IDEMPOTENCY_KEY_LENGTH + 1),
      }),
    ).toBe("invalid idempotency key length");

    await expect(
      delivery.sendOne({ to: "bad-email", subject: "Hi", text: "Hello" }),
    ).rejects.toThrow("Invalid email");
    expect(transport.singles).toHaveLength(0);
  });

  it("attaches deterministic idempotency keys on single sends and surfaces transport errors", async () => {
    const okTransport = makeRecordingTransport();
    const delivery = createEmailDelivery(okTransport);
    const msg: MailMessage = { to: "delivered@resend.dev", subject: "Hello", text: "World" };

    await delivery.sendOne(msg);
    await delivery.sendOne(msg);

    expect(okTransport.singles).toHaveLength(2);
    expect(okTransport.singles[0]?.idempotencyKey).toBe(okTransport.singles[1]?.idempotencyKey);
    expect(okTransport.singles[0]?.idempotencyKey?.length).toBeLessThanOrEqual(
      MAX_IDEMPOTENCY_KEY_LENGTH,
    );

    const failingDelivery = createEmailDelivery(
      makeRecordingTransport({ failSingle: "rate limited" }),
    );
    await expect(failingDelivery.sendOne(msg)).rejects.toThrow("Email failed: rate limited");
  });

  it("pre-validates entire batch before sending any chunk", async () => {
    const transport = makeRecordingTransport();
    const delivery = createEmailDelivery(transport);
    const emails = Array.from({ length: BATCH_LIMIT + 5 }, (_, i) => makeMessage(i));
    emails[BATCH_LIMIT + 4] = { to: "invalid", subject: "Bad", text: "Bad" };

    const result = await delivery.sendBatch(emails, "reminder");

    expect(result.sent).toBe(0);
    expect(result.error?.message).toContain(`index ${BATCH_LIMIT + 4}`);
    expect(transport.batches).toHaveLength(0);
  });

  it("chunks batches at 100, produces deterministic chunk keys, and reports partial sends", async () => {
    const emptyResult = await createEmailDelivery(makeRecordingTransport()).sendBatch([]);
    expect(emptyResult).toEqual({ sent: 0, error: null });

    const emails = Array.from({ length: BATCH_LIMIT + 5 }, (_, i) => makeMessage(i));
    const t1 = makeRecordingTransport();
    const t2 = makeRecordingTransport();

    const r1 = await createEmailDelivery(t1).sendBatch(emails, "before_training");
    const r2 = await createEmailDelivery(t2).sendBatch(emails, "before_training");

    expect(r1).toEqual({ sent: 105, error: null });
    expect(r2).toEqual({ sent: 105, error: null });
    expect(t1.batches).toHaveLength(2);
    expect(t1.batches[0]?.messages).toHaveLength(100);
    expect(t1.batches[1]?.messages).toHaveLength(5);
    expect(t1.batches[0]?.idempotencyKey).toBe(t2.batches[0]?.idempotencyKey);
    expect(t1.batches[1]?.idempotencyKey).toBe(t2.batches[1]?.idempotencyKey);
    expect(t1.batches[0]?.idempotencyKey).not.toBe(t1.batches[1]?.idempotencyKey);

    const failSecond = makeRecordingTransport({ failBatchAtCall: 2 });
    const partial = await createEmailDelivery(failSecond).sendBatch(emails, "before_training");
    expect(partial.sent).toBe(100);
    expect(partial.error?.message).toBe("Batch 2 failed");
  });

  it("builds distinct idempotency keys when parts change", () => {
    const a = deterministicIdempotencyKey("confirmation", ["id-1", "tok-1"]);
    const b = deterministicIdempotencyKey("confirmation", ["id-1", "tok-2"]);
    expect(a).not.toBe(b);
    expect(a.startsWith("confirmation/")).toBe(true);
  });
});

describe("email composition", () => {
  const fullTime: ConfirmationRegistration = {
    firstName: "Anna <script>alert(1)</script> & Ben",
    email: "anna@example.test",
    seatType: "full_time",
    localityId: TRAINING.localities[0]?.id ?? null,
    otherLocality: "",
    siteId: TRAINING.sites[0]?.id ?? null,
    groupLanguage: "en",
    outlineLanguage: "en",
    secondOutlineLanguage: "ru",
    sessionIds: [],
    waived: false,
  };

  it("renders confirmation text and escaped HTML in all locales with fee transfer and edit links", () => {
    const enMail = composeConfirmation({
      locale: "en",
      training: TRAINING,
      registration: fullTime,
      registrationId: "reg-1",
      token: "tok-1",
      siteUrl: "https://gemeindeinfrankfurt.de",
    });

    expect(enMail.subject).toBe("Registration confirmed: Video Training January 2027");
    expect(enMail.text).toContain("https://gemeindeinfrankfurt.de/en/training/r/tok-1");
    expect(enMail.text).toContain(
      "https://gemeindeinfrankfurt.de/en/training/r/tok-1/calendar.ics",
    );
    expect(enMail.text).toContain(TRAINING.payee_iban);
    expect(enMail.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt; &amp; Ben");
    expect(enMail.html).not.toContain("<script>");
    expect(enMail.html).toContain("English + Russian");

    const deMail = composeConfirmation({
      locale: "de",
      training: TRAINING,
      registration: { ...fullTime, firstName: "Lukas" },
      registrationId: "reg-1",
      token: "tok-1",
      siteUrl: "https://gemeindeinfrankfurt.de",
    });
    expect(deMail.subject).toBe("Anmeldung bestätigt: Videotraining Januar 2027");
    expect(deMail.text).toContain("https://gemeindeinfrankfurt.de/de/training/r/tok-1");

    const ruMail = composeConfirmation({
      locale: "ru",
      training: TRAINING,
      registration: { ...fullTime, firstName: "Мария" },
      registrationId: "reg-1",
      token: "tok-1",
      siteUrl: "https://gemeindeinfrankfurt.de",
    });
    expect(ruMail.subject).toBe("Регистрация подтверждена: Видеотренинг январь 2027");
    expect(ruMail.text).toContain("https://gemeindeinfrankfurt.de/ru/training/r/tok-1");
  });

  it("changes confirmation idempotency key when token changes, and omits transfer block for Anaheim or waived seats without outlines", () => {
    const first = composeConfirmation({
      locale: "en",
      training: TRAINING,
      registration: fullTime,
      registrationId: "reg-1",
      token: "tok-1",
      siteUrl: "https://gemeindeinfrankfurt.de",
    });
    const htmlOnlyEdit = composeConfirmation({
      locale: "en",
      training: TRAINING,
      registration: { ...fullTime, groupLanguage: "de" },
      registrationId: "reg-1",
      token: "tok-1",
      siteUrl: "https://gemeindeinfrankfurt.de",
    });
    const resent = composeConfirmation({
      locale: "en",
      training: TRAINING,
      registration: fullTime,
      registrationId: "reg-1",
      token: "tok-2",
      siteUrl: "https://gemeindeinfrankfurt.de",
    });
    expect(htmlOnlyEdit.text).toBe(first.text);
    expect(htmlOnlyEdit.html).not.toBe(first.html);
    expect(htmlOnlyEdit.idempotencyKey).not.toBe(first.idempotencyKey);
    expect(first.idempotencyKey).not.toBe(resent.idempotencyKey);

    const anaheim = composeConfirmation({
      locale: "en",
      training: TRAINING,
      registration: {
        ...fullTime,
        seatType: "anaheim",
        outlineLanguage: null,
        secondOutlineLanguage: null,
        sessionIds: [TRAINING.sessions[0]!.id, TRAINING.sessions[1]!.id],
        waived: false,
      },
      registrationId: "reg-2",
      token: "tok-3",
      siteUrl: "https://gemeindeinfrankfurt.de",
    });
    expect(anaheim.text).not.toContain(TRAINING.payee_iban);
    expect(anaheim.html).not.toContain(TRAINING.payee_iban);
    expect(anaheim.html).toContain("2 of 3 messages");
  });

  it("composes cancellation emails with registration-scoped idempotency keys", () => {
    const a = composeCancellation({
      locale: "de",
      training: TRAINING,
      registrationId: "reg-a",
      email: "anna@example.test",
      firstName: "Anna",
    });
    const b = composeCancellation({
      locale: "de",
      training: TRAINING,
      registrationId: "reg-b",
      email: "anna@example.test",
      firstName: "Anna",
    });
    const r = composeCancellation({
      locale: "ru",
      training: TRAINING,
      registrationId: "reg-c",
      email: "ivan@example.test",
      firstName: "Иван",
    });

    expect(a.subject).toBe("Anmeldung storniert: Videotraining Januar 2027");
    expect(a.text).toContain("Anna");
    expect(a.idempotencyKey).not.toBe(b.idempotencyKey);
    expect(r.subject).toBe("Регистрация отменена: Видеотренинг январь 2027");
  });

  it("composes payment reminders with only open amounts and shared-seat greeting", () => {
    const baseRecipient: Recipient = {
      email: "pair@example.test",
      locale: "en",
      seat: "shared",
      openCents: 7500,
      groupId: null,
      firstName: "Sarah",
      partnerFirstName: "David",
      sessionIds: [],
      feeOpenCents: 7000,
      outlineOpenCents: 500,
      outlineCount: 1,
    };

    const both = composePaymentReminder(TRAINING, baseRecipient);
    expect(both.text).toContain("Hello Sarah, David,");
    expect(both.text).toContain("Training fee");
    expect(both.text).toContain("Outlines (1)");

    const feeOnly = composePaymentReminder(TRAINING, {
      ...baseRecipient,
      partnerFirstName: null,
      openCents: 7000,
      outlineOpenCents: 0,
    });
    expect(feeOnly.text).toContain("Hello Sarah,");
    expect(feeOnly.text).toContain("Training fee");
    expect(feeOnly.text).not.toContain("Outlines (");

    const outlineOnly = composePaymentReminder(TRAINING, {
      ...baseRecipient,
      partnerFirstName: null,
      openCents: 500,
      feeOpenCents: 0,
    });
    expect(outlineOnly.text).not.toContain("Training fee");
    expect(outlineOnly.text).toContain("Outlines (1)");
  });

  it("composes before-training emails with session filtering, English note fallback, and all 7 verbatim rules", () => {
    const partTimer: Recipient = {
      email: "part@example.test",
      locale: "de",
      seat: "part_time",
      openCents: 0,
      groupId: null,
      firstName: "Lukas",
      partnerFirstName: null,
      sessionIds: [TRAINING.sessions[1]!.id],
      feeOpenCents: 0,
      outlineOpenCents: 0,
      outlineCount: 0,
    };

    const mail = composeBeforeTraining(TRAINING, partTimer, { en: "Join WhatsApp here." });
    expect(mail.text).toContain("Join WhatsApp here.");
    expect(mail.text).toContain("Botschaft 2");
    expect(mail.text).not.toContain("Botschaft 1");
    expect(mail.text).not.toContain("Botschaft 3");
    expect(mail.text).toContain(de.register.attendRules.seat);
    expect(mail.text).toContain(de.register.attendRules.nameTag);
    expect(mail.text).toContain(de.register.attendRules.absences);
    expect(mail.text).toContain(de.register.attendRules.testing);
    expect(mail.text).toContain(de.register.attendRules.leaving);
    expect(mail.text).toContain(de.register.materialsRule);
    expect(mail.text).toContain(de.register.copiesRule);

    const full = composeBeforeTraining(
      TRAINING,
      { ...partTimer, locale: "en", seat: "full_time", sessionIds: [] },
      { en: "English note" },
    );
    expect(full.text).toContain("Message 1");
    expect(full.text).toContain("Message 2");
    expect(full.text).toContain("Message 3");
    expect(full.text).toContain(en.register.materialsRule);
  });

  it("composes coordinator messages with English fallback and canonical English audit subjects", () => {
    const texts = {
      en: { subject: "Room change", body: "Meet upstairs." },
      ru: { subject: "Смена комнаты", body: "Встреча наверху." },
    };

    const ruMsg = composeCoordinatorMessage(texts, "user@example.test", "ru");
    const deFallback = composeCoordinatorMessage(texts, "user@example.test", "de");
    const empty = composeCoordinatorMessage({}, "user@example.test", "en");

    expect(ruMsg?.subject).toBe("Смена комнаты");
    expect(ruMsg?.text).toContain(ru.email.footer);
    expect(deFallback?.subject).toBe("Room change");
    expect(deFallback?.text).toContain(en.email.footer);
    expect(empty).toBeNull();

    expect(canonicalReminderSubject(TRAINING)).toBe(
      "Payment reminder: Video Training January 2027",
    );
    expect(canonicalBeforeTrainingSubject(TRAINING)).toBe(
      "Before the training: Video Training January 2027",
    );
  });
});
