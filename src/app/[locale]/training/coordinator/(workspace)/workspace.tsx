import "server-only";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactElement } from "react";

import { PageMessage } from "@/components/ui/page-message";
import { sectionHref } from "@/features/coordinator/sections";
import { requireLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { loadAccessContext, type CurrentCoordinator } from "@/lib/auth";
import { loadCoordination, type CoordinatorDashboard } from "@/lib/coordinator";
import type { SectionKey } from "@/lib/domain/links";
import { canAccessSection, firstAllowedSection, type RoleTabPermissions } from "@/lib/domain/roles";
import type { Language } from "@/lib/domain/types";

type Coordination = Exclude<Awaited<ReturnType<typeof loadCoordination>>, "signed-out">;

export type WorkspaceSession = Coordination & {
  locale: Language;
  currentUser: CurrentCoordinator;
  permissions: RoleTabPermissions;
  allowedSections: readonly SectionKey[];
};

export type ActiveWorkspace = WorkspaceSession & {
  data: CoordinatorDashboard;
};

// Validates the route locale, sets next-intl's request locale, and ensures a
// coordinator/helper is signed in (otherwise redirects to the login page).
export async function requireWorkspaceSession(rawLocale: string): Promise<WorkspaceSession> {
  const locale = requireLocale(rawLocale);
  setRequestLocale(locale);
  const coordination = await loadCoordination();
  if (coordination === "signed-out") {
    return redirect({ href: "/training/coordinator/login", locale });
  }
  const access = await loadAccessContext(coordination.supabase);
  if (!access.currentUser) {
    return redirect({ href: "/training/coordinator/login", locale });
  }
  return {
    locale,
    ...coordination,
    currentUser: access.currentUser,
    permissions: access.permissions,
    allowedSections: access.allowedSections,
  };
}

// Ensures the signed-in user may view `section`. Disallowed visitors are sent
// to their first allowed section, or shown a clear notice if none are enabled.
export async function requireSectionSession(
  rawLocale: string,
  section: SectionKey,
): Promise<{ ok: true; session: WorkspaceSession } | { ok: false; fallback: ReactElement }> {
  const session = await requireWorkspaceSession(rawLocale);
  if (!canAccessSection(session.currentUser.role, session.permissions, section)) {
    const first = firstAllowedSection(session.currentUser.role, session.permissions);
    if (first && first !== section) {
      return redirect({ href: sectionHref(first), locale: session.locale });
    }
    const t = await getTranslations("coordinator");
    return {
      ok: false,
      fallback: <PageMessage title={t("noAccessTitle")} body={t("noAccessBody")} />,
    };
  }
  return { ok: true, session };
}

// Same as requireSectionSession, plus renders the standard "no training"
// empty state when no training exists yet.
export async function requireActiveWorkspace(
  rawLocale: string,
  section: SectionKey,
): Promise<{ ok: true; workspace: ActiveWorkspace } | { ok: false; fallback: ReactElement }> {
  const res = await requireSectionSession(rawLocale, section);
  if (!res.ok) return res;
  if (!res.session.data) {
    const th = await getTranslations("home");
    return { ok: false, fallback: <PageMessage title={th("noTraining")} /> };
  }
  return { ok: true, workspace: { ...res.session, data: res.session.data } };
}
