import { setRequestLocale } from "next-intl/server";

import { CoordinatorShell } from "@/features/coordinator/CoordinatorShell";
import { LiveRefresh } from "@/features/coordinator/LiveRefresh";
import { requireLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { loadCoordination } from "@/lib/coordinator";

import { signOut } from "./actions";

// Every coordinator page sits in this shell; signed-out visitors go to the sign-in page.
export default async function CoordinatorWorkspaceLayout({
  children,
  params,
}: LayoutProps<"/[locale]/training/coordinator">) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const coordination = await loadCoordination();
  if (coordination === "signed-out") {
    return redirect({ href: "/training/coordinator/login", locale });
  }
  const training = coordination.data?.training;
  return (
    <CoordinatorShell trainingTitle={training?.title[locale] ?? null} signOut={signOut}>
      {training && <LiveRefresh trainingId={training.id} />}
      {children}
    </CoordinatorShell>
  );
}
