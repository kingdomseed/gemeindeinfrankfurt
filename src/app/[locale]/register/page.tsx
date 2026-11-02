import { getTranslations, setRequestLocale } from "next-intl/server";
import { RegistrationForm } from "@/components/RegistrationForm";
import { getPublishedTraining } from "@/lib/data";
import { canRegister } from "@/lib/domain/cutoffs";
import type { Language } from "@/lib/domain/types";
import { sessionLabel } from "@/lib/format";
import { register } from "./actions";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ params }: PageProps<"/[locale]/register">) {
  const { locale: raw } = await params;
  const locale = raw as Language;
  setRequestLocale(locale);
  const t = await getTranslations("register");
  const th = await getTranslations("home");
  const training = await getPublishedTraining();

  if (!training || !canRegister(training.sessions)) return <p className="mt-10">{t("closed")}</p>;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">{t("title", { training: training.title[locale] })}</h1>
        {training.venue && <p className="text-lg text-muted">{t("locality", { locality: training.venue })}</p>}
      </div>
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
