import "server-only";
import { cache } from "react";
import { z } from "zod";

import type { SectionKey } from "@/lib/domain/links";
import {
  allowedSectionsForRole,
  canAccessSection,
  configurableRoles,
  defaultRoleTabPermissions,
  normalizeSectionList,
  resolveCoordinatorRole,
  type CoordinatorRole,
  type RoleTabPermissions,
} from "@/lib/domain/roles";
import { createClient } from "@/lib/supabase/server";

export type CoordinatorClient = Awaited<ReturnType<typeof createClient>>;

export type CurrentCoordinator = {
  userId: string;
  displayName: string;
  email: string | null;
  role: CoordinatorRole;
  isAdmin: boolean;
  servesAv: boolean;
};

const rolePermissionRow = z.object({
  role: z.enum(configurableRoles),
  tabs: z.array(z.string()),
});

// Returns a Supabase client acting as the signed-in coordinator, or null when
// nobody is signed in or the account is not in the coordinators table. Cached
// for one request, so a layout and its page check only once.
export const getCoordinatorClient = cache(async () => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase.rpc("is_coordinator");
  return data === true ? supabase : null;
});

// For server actions: they can be called directly by anyone, so each one that
// touches coordinator data starts with this check.
export async function requireAuth() {
  const supabase = await getCoordinatorClient();
  if (!supabase) throw new Error("Not a coordinator");
  return supabase;
}

// The signed-in coordinator's identity, email, and role flags, cached per request.
export const loadCurrentCoordinator = cache(
  async (supabase: CoordinatorClient): Promise<CurrentCoordinator | null> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await supabase
      .from("coordinators")
      .select("user_id, display_name, is_admin, serves_av, role")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const role = resolveCoordinatorRole(data.role, data.is_admin);
    return {
      userId: data.user_id,
      displayName: data.display_name,
      email: auth.user.email ?? null,
      role,
      isAdmin: role === "admin",
      servesAv: data.serves_av,
    };
  },
);

// Per-role tab visibility settings for non-admin roles, cached per request.
export const loadRoleTabPermissions = cache(
  async (supabase: CoordinatorClient): Promise<RoleTabPermissions> => {
    const { data, error } = await supabase.from("role_permissions").select("role, tabs");
    if (error) throw error;
    const rows = z.array(rolePermissionRow).parse(data);
    const byRole = new Map(rows.map((r) => [r.role, normalizeSectionList(r.tabs)]));
    return {
      coordinator: byRole.get("coordinator") ?? [...defaultRoleTabPermissions.coordinator],
      helper: byRole.get("helper") ?? [...defaultRoleTabPermissions.helper],
    };
  },
);

export type AccessContext = {
  currentUser: CurrentCoordinator | null;
  permissions: RoleTabPermissions;
  allowedSections: readonly SectionKey[];
};

export const loadAccessContext = cache(
  async (supabase: CoordinatorClient): Promise<AccessContext> => {
    const [currentUser, permissions] = await Promise.all([
      loadCurrentCoordinator(supabase),
      loadRoleTabPermissions(supabase),
    ]);
    return {
      currentUser,
      permissions,
      allowedSections: currentUser ? allowedSectionsForRole(currentUser.role, permissions) : [],
    };
  },
);

// For server actions scoped to one workspace section: verifies both membership
// and role permission to that section before mutating data.
export async function requireSectionAuth(section: SectionKey): Promise<CoordinatorClient> {
  const supabase = await requireAuth();
  const access = await loadAccessContext(supabase);
  if (
    !access.currentUser ||
    !canAccessSection(access.currentUser.role, access.permissions, section)
  ) {
    throw new Error("Forbidden");
  }
  return supabase;
}

// The signed-in coordinator's display name for audit trails, or "" when absent.
export async function currentCoordinatorName(supabase: CoordinatorClient): Promise<string> {
  return (await loadCurrentCoordinator(supabase))?.displayName ?? "";
}
