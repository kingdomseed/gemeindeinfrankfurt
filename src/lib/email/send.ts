import "server-only";
import { getTranslations } from "next-intl/server";
import { Resend } from "resend";

import { calendarUrl } from "@/lib/calendar";
import type { Training, TrainingWithSessions } from "@/lib/data";
import { computeFees, formatEuro } from "@/lib/domain/fees";
import { trainingDates } from "@/lib/domain/sessions";
import { picksSessions, type Language } from "@/lib/domain/types";
import type { RegistrationInput } from "@/lib/registrations";

import { confirmationHtml } from "./confirmation-html";

function client() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

async function send(to: string, subject: string, text: string, html?: string) {
  const resend = client();
  if (!resend) {
    // Local development without an email provider.
    console.warn(`[email skipped: RESEND_API_KEY not set] ${subject}`);
    return;
  }
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("Missing environment variable EMAIL_FROM");
  const replyTo = process.env.EMAIL_REPLY_TO;
  const { error } = await resend.emails.send({
    from,
    ...(replyTo ? { replyTo } : {}),
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  });
  if (error) throw new Error(`Email failed: ${error.message}`);
}

export function editUrl(locale: Language, token: string) {
  return `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/training/r/${token}`;
}

export async function sendConfirmation(opts: {
  locale: Language;
  training: TrainingWithSessions;
  registration: RegistrationInput;
  token: string;
}) {
  const { locale, training, registration: r, token } = opts;
  const [t, tr, tc, tl] = await Promise.all([
    getTranslations({ locale, namespace: "email" }),
    getTranslations({ locale, namespace: "register" }),
    getTranslations({ locale, namespace: "calendar" }),
    getTranslations({ locale, namespace: "common.languages" }),
  ]);
  const fees = computeFees(
    {
      seatType: r.seat_type,
      outlineLanguage: r.outline_language,
      secondOutlineLanguage: r.second_outline_language,
    },
    { feeCents: training.fee_cents, outlinePriceCents: training.outline_price_cents },
  );
  const title = training.title[locale];
  const body = [
    t("confirmationIntro", { name: r.first_name }),
    "",
    `${title}: ${tr(`seat.${r.seat_type}`)}`,
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
    tc("emailLine", { url: calendarUrl(locale, token) }),
    "",
    t("editLink", { url: editUrl(locale, token) }),
  ].join("\n");
  const euro = (cents: number) => formatEuro(cents, locale);
  const total = fees.trainingCents + fees.outlineCents;
  const sessionCount = training.sessions.length;
  const messages = picksSessions(r.seat_type)
    ? tr("messagesChosen", { count: r.session_ids.length, total: sessionCount })
    : tr("messagesAll", { total: sessionCount });
  const dates = trainingDates(training.sessions, locale);
  const html = confirmationHtml({
    lang: locale,
    brand: title,
    heading: t("confirmationIntro", { name: r.first_name }),
    intro: dates ? `${title} · ${dates}` : title,
    details: [
      { label: tr("summarySeat"), value: `${tr(`seat.${r.seat_type}`)}, ${messages}` },
      { label: tr("summaryGroup"), value: tl(r.group_language) },
      ...(r.outline_language
        ? [
            {
              label: tr("summaryOutline"),
              value: [r.outline_language, r.second_outline_language]
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
    calendar: { label: tc("yourMessages"), url: calendarUrl(locale, token) },
    change: {
      intro: t("changeIntro"),
      label: t("changeButton"),
      url: editUrl(locale, token),
      note: t("linkPrivate"),
    },
    footer: t("footer"),
  });
  await send(r.email, t("confirmationSubject", { training: title }), body, html);
}

export async function sendCancellation(opts: {
  locale: Language;
  training: Training;
  email: string;
  firstName: string;
}) {
  const t = await getTranslations({ locale: opts.locale, namespace: "email" });
  const title = opts.training.title[opts.locale];
  await send(
    opts.email,
    t("cancellationSubject", { training: title }),
    t("cancellationBody", { name: opts.firstName }),
  );
}
