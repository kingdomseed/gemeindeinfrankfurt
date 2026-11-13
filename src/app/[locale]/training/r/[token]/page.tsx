import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageMessage } from "@/components/ui/page-message";
import { CancelRegistration } from "@/features/registration/CancelRegistration";
import { trainingFormProps } from "@/features/registration/form-props";
import { RegistrationForm } from "@/features/registration/RegistrationForm";
import { RegistrationPage } from "@/features/registration/RegistrationPage";
import { requireLocale } from "@/i18n/locale";
import { getTrainingById } from "@/lib/data";
import { canChangeSeatOrSessions } from "@/lib/domain/cutoffs";
import { findByToken } from "@/lib/registrations";

import { cancelRegistration, updateRegistration } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/training/r/[token]">) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "edit" });
  return { title: t("title") };
}

export default async function EditPage({ params }: PageProps<"/[locale]/training/r/[token]">) {
  const { locale: raw, token } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const [t, tr, th, reg] = await Promise.all([
    getTranslations("edit"),
    getTranslations("register"),
    getTranslations("home"),
    findByToken(token),
  ]);

  if (!reg) return <PageMessage title={t("notFound")} body={t("notFoundBody")} />;
  if (reg.status === "cancelled") {
    return <PageMessage title={t("cancelledTitle")} body={t("cancelledBody")} />;
  }

  const training = await getTrainingById(reg.training_id);
  const seatLocked = !canChangeSeatOrSessions(training.sessions);

  return (
    <RegistrationPage
      title={`${t("title")}: ${training.title[locale]}`}
      lockedNotice={seatLocked ? t("locked") : undefined}
    >
      <RegistrationForm
        {...trainingFormProps(training, locale, (number) => th("message", { number }))}
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
        <CancelRegistration
          action={cancelRegistration.bind(null, token, locale)}
          labels={{
            cancel: t("cancel"),
            confirm: t("cancelConfirm"),
            explain: t("cancelExplain"),
            yes: t("cancelYes"),
            keep: t("cancelKeep"),
          }}
          messages={{ cancelled: t("cancelled"), locked: t("locked"), error: tr("error") }}
        />
      )}
    </RegistrationPage>
  );
}
