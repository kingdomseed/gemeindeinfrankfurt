import "server-only";
import { createTranslator } from "next-intl";

import { localePath } from "@/i18n/routing";
import type { Training, TrainingWithSessions } from "@/lib/data";
import { BERLIN_TIME_ZONE } from "@/lib/domain/berlin-time";
import { textFor, type EmailTexts } from "@/lib/domain/emails";
import { computeFees, formatEuro } from "@/lib/domain/fees";
import { sessionLabel, trainingDates } from "@/lib/domain/sessions";
import { picksSessions, type Language, type SeatType } from "@/lib/domain/types";
import type { Recipient } from "@/lib/emails";

import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import ru from "../../../messages/ru.json";
import { confirmationHtml } from "./confirmation-html";
import { deterministicIdempotencyKey, type MailMessage } from "./transport";

export type ConfirmationRegistration = {
  firstName: string;
  email: string;
  seatType: SeatType;
  localityId: string | null;
  otherLocality: string;
  siteId: string | null;
  groupLanguage: Language;
  outlineLanguage: Language | null;
  secondOutlineLanguage: Language | null;
  sessionIds: readonly string[];
  waived: boolean;
};

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

const catalogs = { de, en, ru } satisfies Record<Language, typeof en>;

function createLocaleTranslators(locale: Language) {
  const messages: typeof en = catalogs[locale];
  const opts = { locale, messages, timeZone: BERLIN_TIME_ZONE } as const;
  return {
    t: createTranslator({ ...opts, namespace: "email" }),
    tr: createTranslator({ ...opts, namespace: "register" }),
    tc: createTranslator({ ...opts, namespace: "calendar" }),
    tl: createTranslator({ ...opts, namespace: "common.languages" }),
    th: createTranslator({ ...opts, namespace: "home" }),
  };
}

type LocaleTranslators = ReturnType<typeof createLocaleTranslators>;

const translatorCache = new Map<Language, LocaleTranslators>();

function translatorsFor(locale: Language): LocaleTranslators {
  const existing = translatorCache.get(locale);
  if (existing) return existing;
  const created = createLocaleTranslators(locale);
  translatorCache.set(locale, created);
  return created;
}

export function editUrl(siteUrl: string, locale: Language, token: string): string {
  return `${siteUrl}${localePath(locale, `/training/r/${token}`)}`;
}

export function calendarUrlFor(siteUrl: string, locale: Language, token: string): string {
  return `${siteUrl}/${locale}/training/r/${token}/calendar.ics`;
}

export function composeConfirmation(opts: {
  locale: Language;
  training: TrainingWithSessions;
  registration: ConfirmationRegistration;
  registrationId: string;
  token: string;
  siteUrl: string;
}): MailMessage {
  const { locale, training, registration: r, registrationId, token, siteUrl } = opts;
  const { t, tr, tc, tl, th } = translatorsFor(locale);
  const fees = computeFees(
    {
      seatType: r.seatType,
      hardshipWaiver: r.waived,
      outlineLanguage: r.outlineLanguage,
      secondOutlineLanguage: r.secondOutlineLanguage,
    },
    { feeCents: training.fee_cents, outlinePriceCents: training.outline_price_cents },
  );
  const title = training.title[locale];
  const localityName =
    training.localities.find((l) => l.id === r.localityId)?.name ?? (r.otherLocality || null);
  const siteName = training.sites.find((s) => s.id === r.siteId)?.name ?? null;
  const calendarLink = calendarUrlFor(siteUrl, locale, token);
  const editLink = editUrl(siteUrl, locale, token);
  const text = [
    t("confirmationIntro", { name: r.firstName }),
    "",
    `${title}: ${tr(`seat.${r.seatType}`)}`,
    ...(localityName ? [`${tr("summaryLocality")}: ${localityName}`] : []),
    ...(siteName ? [`${tr("summarySite")}: ${siteName}`] : []),
    // Anaheim attendees owe nothing, so they get no payment lines.
    ...(fees.trainingCents + fees.outlineCents > 0
      ? [
          `${tr("trainingFee")}: ${formatEuro(fees.trainingCents, locale)}`,
          `${tr("outlines", { count: fees.outlineCount })}: ${formatEuro(fees.outlineCents, locale)}`,
          tr("payTo", {
            payee: training.payee_name,
            iban: training.payee_iban,
            reference: training.payment_reference,
          }),
        ]
      : []),
    "",
    tc("emailLine", { url: calendarLink }),
    "",
    t("editLink", { url: editLink }),
  ].join("\n");

  const euro = (cents: number) => formatEuro(cents, locale);
  const total = fees.trainingCents + fees.outlineCents;
  const sessionCount = training.sessions.length;
  const messages = picksSessions(r.seatType)
    ? tr("messagesChosen", { count: r.sessionIds.length, total: sessionCount })
    : tr("messagesAll", { total: sessionCount });
  const dates = trainingDates(training.sessions, locale, th("lordsDay"));
  const html = confirmationHtml({
    lang: locale,
    brand: title,
    heading: t("confirmationIntro", { name: r.firstName }),
    intro: dates ? `${title} · ${dates}` : title,
    details: [
      ...(localityName ? [{ label: tr("summaryLocality"), value: localityName }] : []),
      ...(siteName ? [{ label: tr("summarySite"), value: siteName }] : []),
      { label: tr("summarySeat"), value: `${tr(`seat.${r.seatType}`)}, ${messages}` },
      { label: tr("summaryGroup"), value: tl(r.groupLanguage) },
      ...(r.outlineLanguage
        ? [
            {
              label: tr("summaryOutline"),
              value: [r.outlineLanguage, r.secondOutlineLanguage]
                .filter((l) => l !== null)
                .map((l) => tl(l))
                .join(" + "),
            },
          ]
        : []),
    ],
    transfer:
      total > 0
        ? {
            title: t("transferTitle", { total: euro(total) }),
            lines: [
              { label: tr("trainingFee"), value: euro(fees.trainingCents) },
              {
                label: tr("outlines", { count: fees.outlineCount }),
                value: euro(fees.outlineCents),
              },
            ],
            account: [
              { label: tr("payee"), value: training.payee_name },
              { label: tr("iban"), value: training.payee_iban },
              { label: tr("reference"), value: training.payment_reference },
            ],
          }
        : null,
    calendar: { label: tc("yourMessages"), url: calendarLink },
    change: {
      intro: t("changeIntro"),
      label: t("changeButton"),
      url: editLink,
      note: t("linkPrivate"),
    },
    footer: t("footer"),
  });
  const subject = t("confirmationSubject", { training: title });
  return {
    to: r.email,
    subject,
    text,
    html,
    idempotencyKey: deterministicIdempotencyKey("confirmation", [
      registrationId,
      token,
      r.email,
      subject,
      text,
      html,
    ]),
  };
}

export function composeCancellation(opts: {
  locale: Language;
  training: Training;
  registrationId: string;
  email: string;
  firstName: string;
}): MailMessage {
  const { t } = translatorsFor(opts.locale);
  const title = opts.training.title[opts.locale];
  const subject = t("cancellationSubject", { training: title });
  const text = t("cancellationBody", { name: opts.firstName });
  return {
    to: opts.email,
    subject,
    text,
    idempotencyKey: deterministicIdempotencyKey("cancellation", [
      opts.registrationId,
      opts.email,
      subject,
      text,
    ]),
  };
}

function greetingName(r: Recipient): string {
  return r.partnerFirstName ? `${r.firstName}, ${r.partnerFirstName}` : r.firstName;
}

// What one person still owes and where to send it.
export function composePaymentReminder(training: TrainingWithSessions, r: Recipient): MailMessage {
  const { t, tr } = translatorsFor(r.locale);
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
export function composeBeforeTraining(
  training: TrainingWithSessions,
  r: Recipient,
  notes: { [L in Language]?: string | undefined },
): MailMessage {
  const { t, tr, th } = translatorsFor(r.locale);
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
export function composeCoordinatorMessage(
  texts: EmailTexts,
  to: string,
  locale: Language,
): MailMessage | null {
  const text = textFor(texts, locale);
  if (!text) return null;
  const { t } = translatorsFor(texts[locale] ? locale : "en");
  return { to, subject: text.subject, text: `${text.body}\n\n${t("footer")}` };
}

export function canonicalReminderSubject(training: Training): string {
  return translatorsFor("en").t("reminderSubject", { training: training.title.en });
}

export function canonicalBeforeTrainingSubject(training: Training): string {
  return translatorsFor("en").t("beforeSubject", { training: training.title.en });
}
