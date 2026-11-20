import { getTranslations, setRequestLocale } from "next-intl/server";
import { z } from "zod";

import { Notice } from "@/components/ui/notice";
import { PageMessage } from "@/components/ui/page-message";
import { HistoryList } from "@/features/coordinator/HistoryList";
import { PaymentPanel } from "@/features/coordinator/PaymentPanel";
import { RegistrationDetailPage } from "@/features/coordinator/RegistrationDetailPage";
import { SendEditLink } from "@/features/coordinator/SendEditLink";
import { CancelRegistration } from "@/features/registration/CancelRegistration";
import { trainingFormProps } from "@/features/registration/form-props";
import { RegistrationForm } from "@/features/registration/RegistrationForm";
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

  const [t, th] = await Promise.all([getTranslations("coordinator"), getTranslations("home")]);
  const id = z.uuid().safeParse(rawId);
  const detail = id.success ? await loadRegistrationDetail(supabase, id.data) : null;
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
  const formProps = trainingFormProps(training, locale, (number) => th("message", { number }));
  return (
    <RegistrationDetailPage registration={reg} note={t("canChange")}>
      <PaymentPanel
        registration={reg}
        fees={feesForRegistration(reg, formProps.prices)}
        action={savePayment.bind(null, reg.id)}
      />
      <RegistrationForm
        {...formProps}
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
        }}
        submitLabel={t("saveChanges")}
        action={saveRegistration.bind(null, reg.id)}
        messages={{ saved: t("saved"), error: t("error") }}
      />
      <SendEditLink action={sendEditLink.bind(null, reg.id)} />
      <CancelRegistration
        action={cancelRegistration.bind(null, reg.id)}
        labels={{
          cancel: t("cancelTitle"),
          confirm: t("cancelConfirm"),
          explain: t("cancelExplain"),
          intro: t("cancelIntro"),
          yes: t("cancelYes"),
          keep: t("cancelKeep"),
        }}
        messages={{ cancelled: t("cancelledNotice"), error: t("error") }}
      />
      <HistoryList events={events} />
    </RegistrationDetailPage>
  );
}
