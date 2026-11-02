import "server-only";
import { getTranslations } from "next-intl/server";
import { Resend } from "resend";

import type { Training } from "@/lib/data";
import { computeFees, formatEuro } from "@/lib/domain/fees";
import type { Language } from "@/lib/domain/types";
import type { RegistrationInput } from "@/lib/registrations";

function client() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

async function send(to: string, subject: string, text: string) {
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
  });
  if (error) throw new Error(`Email failed: ${error.message}`);
}

export function editUrl(locale: Language, token: string) {
  return `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/r/${token}`;
}

export async function sendConfirmation(opts: {
  locale: Language;
  training: Training;
  registration: RegistrationInput;
  token: string;
}) {
  const { locale, training, registration: r, token } = opts;
  const t = await getTranslations({ locale, namespace: "email" });
  const tr = await getTranslations({ locale, namespace: "register" });
  const fees = computeFees(
    {
      seatType: r.seat_type,
      attendedAnaheim: r.attended_anaheim,
      ukraineNotEmployed: r.ukraine_not_employed,
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
    `${tr("trainingFee")}: ${formatEuro(fees.trainingCents, locale)}`,
    `${tr("outlines", { count: fees.outlineCount })}: ${formatEuro(fees.outlineCents, locale)}`,
    tr("payTo", {
      payee: training.payee_name,
      iban: training.payee_iban,
      reference: training.payment_reference,
    }),
    "",
    t("editLink", { url: editUrl(locale, token) }),
  ].join("\n");
  await send(r.email, t("confirmationSubject", { training: title }), body);
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
