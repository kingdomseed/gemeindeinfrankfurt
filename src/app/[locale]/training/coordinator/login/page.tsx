import { setRequestLocale } from "next-intl/server";

import { LoginPage } from "@/features/coordinator/LoginPage";
import { SignInForm } from "@/features/coordinator/SignInForm";
import { requireLocale } from "@/i18n/locale";

export default async function CoordinatorLoginPage({
  params,
}: PageProps<"/[locale]/training/coordinator/login">) {
  setRequestLocale(requireLocale((await params).locale));
  return (
    <LoginPage>
      <SignInForm />
    </LoginPage>
  );
}
