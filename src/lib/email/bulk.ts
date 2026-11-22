import "server-only";
import { getTranslations } from "next-intl/server";

import type { TrainingWithSessions } from "@/lib/data";
import { textFor, type EmailTexts } from "@/lib/domain/emails";
import { formatEuro } from "@/lib/domain/fees";
import { sessionLabel, trainingDates } from "@/lib/domain/sessions";
import { picksSessions, type Language } from "@/lib/domain/types";
import type { Recipient } from "@/lib/emails";

import type { OutgoingEmail } from "./send";

// The training rules as the registration form words them, word for word.
const ruleKeys = [
  "attendRules.seat",
  "attendRules.nameTag",
  "attendRules.absences",
  "attendRules.testing",
  "attendRules.leaving",
  "materialsRule",
  "copiesRule",
] as const;

async function strings(locale: Language) {
  const [t, tr, th] = await Promise.all([
    getTranslations({ locale, namespace: "email" }),
    getTranslations({ locale, namespace: "register" }),
    getTranslations({ locale, namespace: "home" }),
  ]);
  return { t, tr, th };
}

function greetingName(r: Recipient) {
  return r.partnerFirstName ? `${r.firstName}, ${r.partnerFirstName}` : r.firstName;
}

// What one person still owes and where to send it.
export async function paymentReminder(
  training: TrainingWithSessions,
  r: Recipient,
): Promise<OutgoingEmail> {
  const { t, tr } = await strings(r.locale);
  const euro = (cents: number) => formatEuro(cents, r.locale);
  const title = training.title[r.locale];
  const text = [
    t("hello", { name: greetingName(r) }),
    "",
    t("reminderIntro", { training: title, total: euro(r.openCents) }),
    "",
    ...(r.feeOpenCents > 0 ? [`${tr("trainingFee")}: ${euro(r.feeOpenCents)}`] : []),
    ...(r.outlineOpenCents > 0
      ? [`${tr("outlines", { count: r.outlineCount })}: ${euro(r.outlineOpenCents)}`]
      : []),
    "",
    tr("payTo", {
      payee: training.payee_name,
      iban: training.payee_iban,
      reference: training.payment_reference,
    }),
    "",
    t("reminderAlreadyPaid"),
    "",
    t("footer"),
  ].join("\n");
  return { to: r.email, subject: t("reminderSubject", { training: title }), text };
}

// The schedule, place and rules a few days before the first message, with the
// coordinators' note (how to join the WhatsApp group, what to bring).
export async function beforeTraining(
  training: TrainingWithSessions,
  r: Recipient,
  notes: { [L in Language]?: string | undefined },
): Promise<OutgoingEmail> {
  const { t, tr, th } = await strings(r.locale);
  const title = training.title[r.locale];
  const chosen = new Set(r.sessionIds);
  const mine = picksSessions(r.seat)
    ? training.sessions.filter((s) => chosen.has(s.id))
    : training.sessions;
  const note = notes[r.locale] ?? notes.en ?? "";
  const dates = trainingDates(training.sessions, r.locale, th("lordsDay"));
  const text = [
    t("hello", { name: greetingName(r) }),
    "",
    t("beforeIntro", { training: title, dates: dates ?? "" }),
    ...(note ? ["", note] : []),
    "",
    t("yourMessages"),
    ...mine
      .toSorted((a, b) => a.message_number - b.message_number)
      .map(
        (s) =>
          `- ${sessionLabel(s, r.locale, th("message", { number: s.message_number }), th("lordsDay"))}`,
      ),
    ...(training.venue ? ["", t("place", { venue: training.venue })] : []),
    "",
    t("rulesTitle"),
    ...ruleKeys.map((k) => `- ${tr(k)}`),
    "",
    t("footer"),
  ].join("\n");
  return { to: r.email, subject: t("beforeSubject", { training: title }), text };
}

// A coordinator's own message, in the reader's language or else English.
export async function coordinatorMessage(
  texts: EmailTexts,
  to: string,
  locale: Language,
): Promise<OutgoingEmail | null> {
  const text = textFor(texts, locale);
  if (!text) return null;
  const { t } = await strings(texts[locale] ? locale : "en");
  return { to, subject: text.subject, text: `${text.body}\n\n${t("footer")}` };
}
