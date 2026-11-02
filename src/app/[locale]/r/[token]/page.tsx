import { getTranslations, setRequestLocale } from "next-intl/server";

import { CancelButton } from "@/components/CancelButton";
import { RegistrationForm } from "@/components/RegistrationForm";
import { requireLocale } from "@/i18n/locale";
import { getTrainingById } from "@/lib/data";
import { canChangeSeatOrSessions } from "@/lib/domain/cutoffs";
import { sessionLabel } from "@/lib/format";
import { findByToken } from "@/lib/registrations";

import { cancelRegistration, updateRegistration } from "./actions";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: PageProps<"/[locale]/r/[token]">) {
  const { locale: raw, token } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const t = await getTranslations("edit");
  const tr = await getTranslations("register");
  const th = await getTranslations("home");

  const reg = await findByToken(token);
  if (!reg) return <p className="mt-10">{t("notFound")}</p>;
  if (reg.status === "cancelled") return <p className="mt-10">{t("cancelled")}</p>;

  const training = await getTrainingById(reg.training_id);
  const seatLocked = !canChangeSeatOrSessions(training.sessions);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">
        {t("title")}: {training.title[locale]}
      </h1>
      {seatLocked && <p className="rounded-lg bg-warning-bg p-4 text-warning-ink">{t("locked")}</p>}
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
        seatLocked={seatLocked}
        defaults={{
          seat_type: reg.seat_type,
          session_ids: reg.registration_sessions.map((s) => s.session_id),
          first_name: reg.first_name,
          last_name: reg.last_name,
          partner_first_name: reg.partner_first_name ?? "",
          partner_last_name: reg.partner_last_name ?? "",
          email: reg.email,
          phone: reg.phone,
          group_language: reg.group_language,
          outline_language: reg.outline_language,
          second_outline_language: reg.second_outline_language,
          comments: reg.comments,
          payer_name: reg.payer_name,
          attended_anaheim: reg.attended_anaheim,
          ukraine_not_employed: reg.ukraine_not_employed,
        }}
        submitLabel={t("save")}
        action={updateRegistration.bind(null, token, locale)}
        messages={{ saved: t("saved"), error: tr("error") }}
      />
      {!seatLocked && (
        <CancelButton
          action={cancelRegistration.bind(null, token, locale)}
          label={t("cancel")}
          confirm={t("cancelConfirm")}
          messages={{ cancelled: t("cancelled"), locked: t("locked"), error: tr("error") }}
        />
      )}
    </div>
  );
}
