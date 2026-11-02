import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageMessage } from "@/components/ui/page-message";
import { trainingFormProps } from "@/features/registration/form-props";
import { RegistrationForm } from "@/features/registration/RegistrationForm";
import { RegistrationPage } from "@/features/registration/RegistrationPage";
import { requireLocale } from "@/i18n/locale";
import { getPublishedTraining } from "@/lib/data";
import { canRegister } from "@/lib/domain/cutoffs";

import { register } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/register">) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "register" });
  return { title: t("submit") };
}

export default async function RegisterPage({ params }: PageProps<"/[locale]/register">) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const [t, th, training] = await Promise.all([
    getTranslations("register"),
    getTranslations("home"),
    getPublishedTraining(),
  ]);

  if (!training || !canRegister(training.sessions)) {
    return <PageMessage title={t("closedTitle")} body={t("closedBody")} />;
  }

  return (
    <RegistrationPage
      title={t("title", { training: training.title[locale] })}
      subtitle={training.venue ? t("locality", { locality: training.venue }) : undefined}
    >
      <RegistrationForm
        {...trainingFormProps(training, locale, (number) => th("message", { number }))}
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
