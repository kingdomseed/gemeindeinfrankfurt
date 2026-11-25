import { getTranslations, setRequestLocale } from "next-intl/server";
import { z } from "zod";

import { Notice } from "@/components/ui/notice";
import { PageMessage } from "@/components/ui/page-message";
import { CoordinatorRegistrationForm } from "@/features/coordinator/CoordinatorRegistrationForm";
import { HistoryList } from "@/features/coordinator/HistoryList";
import { toPaymentRecord } from "@/features/coordinator/payment-record";
import { PaymentPanel } from "@/features/coordinator/PaymentPanel";
import { RegistrationDetailPage } from "@/features/coordinator/RegistrationDetailPage";
import { SendEditLink } from "@/features/coordinator/SendEditLink";
import { CancelRegistration } from "@/features/registration/CancelRegistration";
import { registrationDefaults, trainingFormProps } from "@/features/registration/form-props";
import { requireLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { getCoordinatorClient } from "@/lib/auth";
import { loadRegistrationDetail } from "@/lib/coordinator";
import { getTrainingById } from "@/lib/data";
import { feesForRegistration } from "@/lib/domain/payments";

import { cancelRegistration, savePayment, saveRegistration, sendEditLink } from "./actions";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/registrations/[id]">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator" });
  return { title: t("registrations") };
}

export default async function RegistrationDetailRoute({ params }: Props) {
  const { locale: raw, id: rawId } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);
  const supabase = await getCoordinatorClient();
  if (!supabase) return redirect({ href: "/training/coordinator/login", locale });

  const id = z.uuid().safeParse(rawId);
  const [t, th, detail] = await Promise.all([
    getTranslations("coordinator"),
    getTranslations("home"),
    id.success ? loadRegistrationDetail(supabase, id.data) : null,
  ]);
  if (!detail) return <PageMessage title={t("notFound")} />;

  const { registration: reg, events } = detail;
  if (reg.status === "cancelled") {
    return (
      <RegistrationDetailPage registration={reg}>
        <Notice tone="neutral">{t("cancelledNotice")}</Notice>
        <HistoryList events={events} />
      </RegistrationDetailPage>
    );
  }

  const training = await getTrainingById(reg.training_id);
  const formProps = trainingFormProps(
    training,
    locale,
    (number) => th("message", { number }),
    th("lordsDay"),
  );
  return (
    <RegistrationDetailPage registration={reg} note={t("canChange")}>
      <PaymentPanel
        registration={toPaymentRecord(reg)}
        fees={feesForRegistration(reg, formProps.prices)}
        action={savePayment.bind(null, reg.id)}
      />
      <CoordinatorRegistrationForm
        sessions={formProps.sessions}
        localities={formProps.localities}
        sites={formProps.sites}
        feeCents={formProps.prices.feeCents}
        defaults={registrationDefaults(reg)}
        version={reg.updated_at}
        action={saveRegistration.bind(null, reg.id)}
      />
      <SendEditLink action={sendEditLink.bind(null, reg.id)} />
      <CancelRegistration audience="coordinator" action={cancelRegistration.bind(null, reg.id)} />
      <HistoryList events={events} />
    </RegistrationDetailPage>
  );
}
