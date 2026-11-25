import { getTranslations, setRequestLocale } from "next-intl/server";

import { Card } from "@/components/ui/card";
import { PageMessage } from "@/components/ui/page-message";
import { AddToCalendar } from "@/features/registration/AddToCalendar";
import { CancelRegistration } from "@/features/registration/CancelRegistration";
import { registrationDefaults, trainingFormProps } from "@/features/registration/form-props";
import { PaymentStatus } from "@/features/registration/PaymentStatus";
import { RegistrationForm } from "@/features/registration/RegistrationForm";
import { RegistrationPage } from "@/features/registration/RegistrationPage";
import { requireLocale } from "@/i18n/locale";
import { calendarUrl } from "@/lib/calendar";
import { getTrainingById } from "@/lib/data";
import { canChangeSeatOrSessions } from "@/lib/domain/cutoffs";
import { feesForRegistration } from "@/lib/domain/payments";
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
  const [t, tr, th, tc, reg] = await Promise.all([
    getTranslations("edit"),
    getTranslations("register"),
    getTranslations("home"),
    getTranslations("calendar"),
    findByToken(token),
  ]);

  if (!reg) return <PageMessage title={t("notFound")} body={t("notFoundBody")} />;
  if (reg.status === "cancelled") {
    return <PageMessage title={t("cancelledTitle")} body={t("cancelledBody")} />;
  }

  const training = await getTrainingById(reg.training_id);
  const seatLocked = !canChangeSeatOrSessions(training.sessions);
  const formProps = trainingFormProps(
    training,
    locale,
    (number) => th("message", { number }),
    th("lordsDay"),
  );
  const fees = feesForRegistration(reg, formProps.prices);

  return (
    <RegistrationPage
      title={t("title")}
      subtitle={t("subtitle", {
        training: training.title[locale],
        reference: training.payment_reference,
      })}
      lockedNotice={seatLocked ? t("locked") : undefined}
    >
      {fees.trainingCents + fees.outlineCents > 0 && (
        <PaymentStatus
          fees={fees}
          feePaid={reg.fee_paid}
          outlinePaid={reg.outline_paid}
          payment={formProps.payment}
        />
      )}
      <Card>
        <AddToCalendar icsUrl={calendarUrl(locale, token)} label={tc("yourMessages")} />
      </Card>
      <RegistrationForm
        {...formProps}
        seatLocked={seatLocked}
        defaults={registrationDefaults(reg)}
        version={reg.updated_at}
        submitLabel={t("save")}
        action={updateRegistration.bind(null, token, locale)}
        messages={{ saved: t("saved"), stale: t("stale"), error: tr("error") }}
      />
      {!seatLocked && (
        <CancelRegistration
          audience="registrant"
          action={cancelRegistration.bind(null, token, locale)}
        />
      )}
    </RegistrationPage>
  );
}
