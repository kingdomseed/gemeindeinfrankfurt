import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { loadCurrentCoordinator, type CoordinatorClient } from "@/lib/auth";
import {
  configurableRoles,
  normalizeSectionList,
  resolveCoordinatorRole,
  type CoordinatorRole,
  type RoleTabPermissions,
} from "@/lib/domain/roles";
import type { Language } from "@/lib/domain/types";
import { siteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

export type TeamMember = {
  userId: string;
  name: string;
  email: string;
  role: CoordinatorRole;
  isAdmin: boolean;
  // Serves in AV (Technik), so sees the webcast login.
  servesAv: boolean;
  isYou: boolean;
  // Null until they have signed in once.
  lastSignInAt: string | null;
};

// Everyone who can sign in to coordination. Names and roles come from the
// coordinators table as the signed-in coordinator sees it; email addresses and
// sign-in times only exist in Supabase Auth, which needs the service role.
export async function loadTeam(supabase: CoordinatorClient): Promise<TeamMember[]> {
  const [{ data: rows, error }, { data: me }] = await Promise.all([
    supabase
      .from("coordinators")
      .select("user_id, display_name, is_admin, serves_av, role")
      .order("display_name"),
    supabase.auth.getUser(),
  ]);
  if (error) throw error;
  const users = await Promise.all(
    rows.map((r) => createAdminClient().auth.admin.getUserById(r.user_id)),
  );
  return rows.map((r, i) => {
    const user = users[i]?.data.user;
    const role = resolveCoordinatorRole(r.role, r.is_admin);
    return {
      userId: r.user_id,
      name: r.display_name,
      email: user?.email ?? "",
      role,
      isAdmin: role === "admin",
      servesAv: r.serves_av,
      isYou: r.user_id === me.user?.id,
      lastSignInAt: user?.last_sign_in_at ?? null,
    };
  });
}

// Whether the signed-in coordinator is an admin (may manage team & tab permissions).
export async function isTeamAdmin(supabase: CoordinatorClient): Promise<boolean> {
  return (await loadCurrentCoordinator(supabase))?.isAdmin === true;
}

// Gives an email address coordination access with the chosen role: creates the
// sign-in account if there is none yet, then upserts the coordinators row.
export async function addCoordinator(
  name: string,
  email: string,
  role: CoordinatorRole = "coordinator",
): Promise<void> {
  const admin = createAdminClient();
  const created = await admin.auth.admin.createUser({ email, email_confirm: true });
  let userId = created.data.user?.id;
  if (!userId) {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;
    userId = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
  }
  if (!userId) throw created.error ?? new Error("Could not create the sign-in account");
  const { error } = await admin
    .from("coordinators")
    .upsert(
      { user_id: userId, display_name: name, role, is_admin: role === "admin" },
      { onConflict: "user_id" },
    );
  if (error) throw error;
}

// Takes away coordination access at once. The sign-in account stays, so their
// name stays on the history lines they wrote.
export async function removeCoordinator(userId: string): Promise<void> {
  const { error } = await createAdminClient().from("coordinators").delete().eq("user_id", userId);
  if (error) throw error;
}

// Updates a member's role (admin, coordinator, or helper).
export async function setRole(userId: string, role: CoordinatorRole): Promise<void> {
  const { error } = await createAdminClient()
    .from("coordinators")
    .update({ role, is_admin: role === "admin" })
    .eq("user_id", userId);
  if (error) throw error;
}

// Says whether a member serves in AV (Technik) and so sees the webcast login.
export async function setServesAv(userId: string, servesAv: boolean): Promise<void> {
  const { error } = await createAdminClient()
    .from("coordinators")
    .update({ serves_av: servesAv })
    .eq("user_id", userId);
  if (error) throw error;
}

// Saves which coordination tabs each configurable role (coordinator, helper) sees.
export async function saveRoleTabPermissions(permissions: RoleTabPermissions): Promise<void> {
  const updatedAt = new Date().toISOString();
  const rows = configurableRoles.map((role) => ({
    role,
    tabs: normalizeSectionList(permissions[role]),
    updated_at: updatedAt,
  }));
  const { error } = await createAdminClient()
    .from("role_permissions")
    .upsert(rows, { onConflict: "role" });
  if (error) throw error;
}

// Emails a coordinator the same sign-in link the sign-in page sends. A client
// without cookies, so the link works on whichever device they open it.
export async function sendSignInLink(email: string, locale: Language): Promise<void> {
  const client = createSupabaseClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false, flowType: "implicit" },
  });
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${siteUrl()}/${locale}/training/coordinator`,
    },
  });
  if (error) throw error;
}
