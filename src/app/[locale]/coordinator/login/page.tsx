import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ params }: PageProps<"/[locale]/coordinator/login">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("coordinator");
  return (
    <div className="mt-10 max-w-sm space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">{t("signIn")}</h1>
      <p className="text-muted">{t("signInHelp")}</p>
      <LoginForm />
    </div>
  );
}
