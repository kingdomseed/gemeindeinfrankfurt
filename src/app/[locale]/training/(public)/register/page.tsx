import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageMessage } from "@/components/ui/page-message";
import { AddToCalendar } from "@/features/registration/AddToCalendar";
import { trainingFormProps } from "@/features/registration/form-props";
import { RegistrationForm } from "@/features/registration/RegistrationForm";
import { RegistrationPage } from "@/features/registration/RegistrationPage";
import { requireLocale } from "@/i18n/locale";
import { calendarUrl } from "@/lib/calendar";
import { getPublishedTraining } from "@/lib/data";
import { canRegister } from "@/lib/domain/cutoffs";
import { trainingDates } from "@/lib/domain/sessions";

import { register } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/training/register">) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "register" });
  return { title: t("submit") };
}

export default async function RegisterPage({ params }: PageProps<"/[locale]/training/register">) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const [t, th, tc, training] = await Promise.all([
    getTranslations("register"),
    getTranslations("home"),
    getTranslations("calendar"),
    getPublishedTraining(),
  ]);

  if (!training || !canRegister(training.sessions)) {
    return <PageMessage title={t("closedTitle")} body={t("closedBody")} />;
  }

  return (
    <RegistrationPage
      title={t("title")}
      dates={trainingDates(training.sessions, locale, th("lordsDay")) ?? undefined}
      aside={<AddToCalendar icsUrl={calendarUrl(locale)} label={tc("allMessages")} />}
    >
      <RegistrationForm
        {...trainingFormProps(
          training,
          locale,
          (number) => th("message", { number }),
          th("lordsDay"),
        )}
        submitLabel={t("submit")}
        action={register.bind(null, locale)}
        messages={{
          done: t("done"),
          error: t("error"),
          closed: t("closed"),
          duplicate: t("duplicateWarning"),
        }}
      />
    </RegistrationPage>
  );
}
