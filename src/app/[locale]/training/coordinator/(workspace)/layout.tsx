import { CoordinatorShell } from "@/features/coordinator/CoordinatorShell";
import { LiveWorkspace } from "@/features/coordinator/LiveWorkspace";
import { loadCurrentCoordinator } from "@/lib/auth";
import { loadTrainingLinks } from "@/lib/links";

import { addSpaceLink, removeSpaceLink, signOut } from "./actions";
import { requireWorkspaceSession } from "./workspace";

// Every coordinator page sits in this shell; signed-out visitors go to the sign-in page.
export default async function CoordinatorWorkspaceLayout({
  children,
  params,
}: LayoutProps<"/[locale]/training/coordinator">) {
  const { locale, supabase, data } = await requireWorkspaceSession((await params).locale);
  const training = data?.training;
  const [currentUser, links] = await Promise.all([
    loadCurrentCoordinator(supabase),
    training ? loadTrainingLinks(supabase, training.id) : [],
  ]);
  const liveUser = currentUser
    ? { userId: currentUser.userId, displayName: currentUser.displayName }
    : null;
  return (
    <LiveWorkspace trainingId={training?.id ?? null} currentUser={liveUser}>
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
