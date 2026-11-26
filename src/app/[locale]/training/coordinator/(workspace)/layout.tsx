import { CoordinatorShell } from "@/features/coordinator/CoordinatorShell";
import { LiveWorkspace } from "@/features/coordinator/LiveWorkspace";
import { loadTrainingLinks } from "@/lib/links";

import { addSpaceLink, removeSpaceLink, signOut } from "./actions";
import { requireWorkspaceSession } from "./workspace";

// Every coordinator page sits in this shell; signed-out visitors go to the sign-in page.
export default async function CoordinatorWorkspaceLayout({
  children,
  params,
}: LayoutProps<"/[locale]/training/coordinator">) {
  const { locale, supabase, data, currentUser, allowedSections } = await requireWorkspaceSession(
    (await params).locale,
  );
  const training = data?.training;
  const links = training ? await loadTrainingLinks(supabase, training.id) : [];
  const liveUser = { userId: currentUser.userId, displayName: currentUser.displayName };
  return (
    <LiveWorkspace trainingId={training?.id ?? null} currentUser={liveUser}>
      <CoordinatorShell
        trainingTitle={training?.title[locale] ?? null}
        allowedSections={allowedSections}
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
