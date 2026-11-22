"use server";

import { getTranslations } from "next-intl/server";
import { refresh } from "next/cache";
import { z } from "zod";

import type { FormState } from "@/features/coordinator/types";
import { requireAuth } from "@/lib/auth";
import { getTrainingById } from "@/lib/data";
import { inAudience, isAudience, type EmailTexts } from "@/lib/domain/emails";
import { languages, type Language } from "@/lib/domain/types";
import { beforeTraining, coordinatorMessage, paymentReminder } from "@/lib/email/bulk";
import { sendBatch, type OutgoingEmail } from "@/lib/email/send";
import { loadRecipients, recordSend, signedInCoordinator, type EmailKind } from "@/lib/emails";

const id = z.uuid();
const subject = z.string().trim().max(200);
const body = z.string().trim().max(10_000);

async function setUp(rawTrainingId: string) {
  const supabase = await requireAuth();
  const training = await getTrainingById(id.parse(rawTrainingId));
  const recipients = await loadRecipients(supabase, training.id, {
    feeCents: training.fee_cents,
    outlinePriceCents: training.outline_price_cents,
  });
  return { supabase, training, recipients };
}

async function deliver(
  supabase: Awaited<ReturnType<typeof requireAuth>>,
  send: { trainingId: string; kind: EmailKind; subject: string; emails: OutgoingEmail[] },
): Promise<FormState> {
  const t = await getTranslations("coordinator.emails");
  if (send.emails.length === 0) return { status: "error", message: t("nobody") };
  const { sent, error } = await sendBatch(send.emails);
  // What went out is logged even when the rest failed, so the log stays true.
  if (sent > 0) await recordSend(supabase, { ...send, count: sent });
  refresh();
  if (error) {
    console.error("Bulk email failed", error);
    return {
      status: "error",
      message: t("sendFailed", { sent, total: send.emails.length }),
    };
  }
  return { status: "saved", message: t("sentTo", { count: sent }) };
}

// Reminds everyone who still owes money what is open and where to pay.
export async function sendPaymentReminder(rawTrainingId: string): Promise<FormState> {
  const { supabase, training, recipients } = await setUp(rawTrainingId);
  const emails = await Promise.all(
    recipients.filter((r) => r.openCents > 0).map((r) => paymentReminder(training, r)),
  );
  return deliver(supabase, {
    trainingId: training.id,
    kind: "payment_reminder",
    subject: emails[0]?.subject ?? "",
    emails,
  });
}

const notes = (form: FormData) =>
  Object.fromEntries(
    languages.flatMap((l) => {
      const note = body.parse(form.get(`note_${l}`) ?? "");
      return note ? [[l, note]] : [];
    }),
  );

// Sends everyone their schedule, the place and the rules, with the note.
export async function sendBeforeTraining(
  rawTrainingId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const { supabase, training, recipients } = await setUp(rawTrainingId);
  const written = notes(form);
  const emails = await Promise.all(recipients.map((r) => beforeTraining(training, r, written)));
  return deliver(supabase, {
    trainingId: training.id,
    kind: "before_training",
    subject: emails[0]?.subject ?? "",
    emails,
  });
}

// A coordinator's own message to everyone or a group. English is required,
// since readers whose language is missing get it. "test" sends each written
// language to the coordinator instead.
export async function sendMessage(
  rawTrainingId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const t = await getTranslations("coordinator.emails");
  const texts: EmailTexts = {};
  for (const l of languages) {
    const s = subject.safeParse(form.get(`subject_${l}`) ?? "");
    const b = body.safeParse(form.get(`body_${l}`) ?? "");
    if (!s.success || !b.success) return { status: "error" };
    if (s.data && b.data) texts[l] = { subject: s.data, body: b.data };
  }
  if (!texts.en) return { status: "error", message: t("englishNeeded") };
  const audience = z.string().refine(isAudience).safeParse(form.get("audience"));
  if (!audience.success) return { status: "error" };

  const { supabase, training, recipients } = await setUp(rawTrainingId);
  if (form.get("intent") === "test") {
    const me = await signedInCoordinator(supabase);
    if (!me.email) return { status: "error" };
    const to = me.email;
    const written = languages.filter((l): l is Language => texts[l] !== undefined);
    const emails = (await Promise.all(written.map((l) => coordinatorMessage(texts, to, l)))).filter(
      (e) => e !== null,
    );
    const { error } = await sendBatch(emails);
    if (error) {
      console.error("Test email failed", error);
      return { status: "error", message: t("sendFailed", { sent: 0, total: emails.length }) };
    }
    return { status: "saved", message: t("testSent", { email: to }) };
  }
  const emails = (
    await Promise.all(
      recipients
        .filter((r) => inAudience(r, audience.data))
        .map((r) => coordinatorMessage(texts, r.email, r.locale)),
    )
  ).filter((e) => e !== null);
  return deliver(supabase, {
    trainingId: training.id,
    kind: "message",
    subject: texts.en.subject,
    emails,
  });
}
