import "server-only";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactElement } from "react";

import { PageMessage } from "@/components/ui/page-message";
import { requireLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { loadCoordination, type CoordinatorDashboard } from "@/lib/coordinator";
import type { Language } from "@/lib/domain/types";

type Coordination = Exclude<Awaited<ReturnType<typeof loadCoordination>>, "signed-out">;

export type WorkspaceSession = Coordination & {
  locale: Language;
};

export type ActiveWorkspace = WorkspaceSession & {
  data: CoordinatorDashboard;
};

// Validates the route locale, sets next-intl's request locale, and ensures a
// coordinator is signed in (otherwise redirects to the login page).
export async function requireWorkspaceSession(rawLocale: string): Promise<WorkspaceSession> {
  const locale = requireLocale(rawLocale);
  setRequestLocale(locale);
  const coordination = await loadCoordination();
  if (coordination === "signed-out") {
    return redirect({ href: "/training/coordinator/login", locale });
  }
  return { locale, ...coordination };
}

// Same as requireWorkspaceSession, plus renders the standard "no training"
// empty state when no training exists yet.
export async function requireActiveWorkspace(
  rawLocale: string,
): Promise<{ ok: true; workspace: ActiveWorkspace } | { ok: false; fallback: ReactElement }> {
  const session = await requireWorkspaceSession(rawLocale);
  if (!session.data) {
    const th = await getTranslations("home");
    return { ok: false, fallback: <PageMessage title={th("noTraining")} /> };
  }
  return { ok: true, workspace: { ...session, data: session.data } };
}
