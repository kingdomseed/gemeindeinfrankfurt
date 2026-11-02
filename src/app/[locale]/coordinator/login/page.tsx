import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireLocale } from "@/i18n/locale";

import { LoginForm } from "./LoginForm";

export default async function LoginPage({ params }: PageProps<"/[locale]/coordinator/login">) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("coordinator");
  return (
    <div className="mt-10 max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">{t("signIn")}</h1>
      <p>{t("signInHelp")}</p>
      <LoginForm />
    </div>
  );
}
