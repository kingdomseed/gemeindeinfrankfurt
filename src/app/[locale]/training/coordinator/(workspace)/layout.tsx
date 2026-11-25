import { setRequestLocale } from "next-intl/server";

import { CoordinatorShell } from "@/features/coordinator/CoordinatorShell";
import { LiveWorkspace } from "@/features/coordinator/LiveWorkspace";
import { requireLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { loadCoordination, loadCurrentCoordinator } from "@/lib/coordinator";
import { loadTrainingLinks } from "@/lib/links";

import { addSpaceLink, removeSpaceLink, signOut } from "./actions";

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
  const [currentUser, links] = await Promise.all([
    loadCurrentCoordinator(coordination.supabase),
    training ? loadTrainingLinks(coordination.supabase, training.id) : [],
  ]);
  return (
    <LiveWorkspace trainingId={training?.id ?? null} currentUser={currentUser}>
      <CoordinatorShell
        trainingTitle={training?.title[locale] ?? null}
        links={links}
        addLink={training ? addSpaceLink.bind(null, training.id) : null}
        removeLink={removeSpaceLink}
        signOut={signOut}
      >
        {children}
      </CoordinatorShell>
    </LiveWorkspace>
  );
}
