import { getTranslations, setRequestLocale } from "next-intl/server";

import { RegistrationForm } from "@/components/RegistrationForm";
import { requireLocale } from "@/i18n/locale";
import { getPublishedTraining } from "@/lib/data";
import { canRegister } from "@/lib/domain/cutoffs";
import { sessionLabel } from "@/lib/format";

import { register } from "./actions";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ params }: PageProps<"/[locale]/register">) {
  const { locale: raw } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const [t, th, training] = await Promise.all([
    getTranslations("register"),
    getTranslations("home"),
    getPublishedTraining(),
  ]);

  if (!training || !canRegister(training.sessions)) return <p className="mt-10">{t("closed")}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("title", { training: training.title[locale] })}</h1>
      <RegistrationForm
        sessions={training.sessions.map((s) => ({
          id: s.id,
          label: sessionLabel(s, locale, th("message", { number: s.message_number })),
        }))}
        prices={{ feeCents: training.fee_cents, outlinePriceCents: training.outline_price_cents }}
        payment={{
          payee: training.payee_name,
          iban: training.payee_iban,
          reference: training.payment_reference,
        }}
        rules={training.rules[locale] ?? ""}
        submitLabel={t("submit")}
        action={register.bind(null, locale)}
        messages={{
          done: t("done"),
          error: t("error"),
          closed: t("closed"),
          duplicate: t("duplicateWarning"),
        }}
      />
    </div>
  );
}
