"use server";

import { getLocale } from "next-intl/server";
import { refresh } from "next/cache";
import { z } from "zod";

import type { FormState } from "@/features/coordinator/types";
import { requireLocale } from "@/i18n/locale";
import { requireAuth, requireSectionAuth } from "@/lib/auth";
import { spaceSections } from "@/lib/domain/links";
import { coordinatorRoles } from "@/lib/domain/roles";
import {
  addCoordinator,
  isTeamAdmin,
  loadTeam,
  removeCoordinator,
  saveRoleTabPermissions,
  sendSignInLink,
  setRole,
  setServesAv,
} from "@/lib/team";

const newMember = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().trim().toLowerCase(),
  role: z.enum(coordinatorRoles).default("coordinator"),
});

// Admins only: gives someone team access with the selected role and emails them a sign-in link.
export async function inviteCoordinator(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await requireAuth();
  if (!(await isTeamAdmin(supabase))) return { status: "error" };
  const parsed = newMember.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error" };
  await addCoordinator(parsed.data.name, parsed.data.email, parsed.data.role);
  await sendSignInLink(parsed.data.email, requireLocale(await getLocale()));
  refresh();
  return { status: "saved" };
}

const member = z.object({ user_id: z.uuid() });

// Sends a team member a fresh sign-in link, for example when the first one expired.
export async function resendSignInLink(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await requireSectionAuth("setup");
  const parsed = member.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error" };
  const target = (await loadTeam(supabase)).find((m) => m.userId === parsed.data.user_id);
  if (!target?.email) return { status: "error" };
  await sendSignInLink(target.email, requireLocale(await getLocale()));
  return { status: "saved" };
}

// Admins only: takes away someone else's team access.
export async function removeTeamMember(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await requireAuth();
  if (!(await isTeamAdmin(supabase))) return { status: "error" };
  const parsed = member.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error" };
  const { data: me } = await supabase.auth.getUser();
  if (me.user?.id === parsed.data.user_id) return { status: "error" };
  await removeCoordinator(parsed.data.user_id);
  refresh();
  return { status: "saved" };
}

const avChange = z.object({ user_id: z.uuid(), serves_av: z.enum(["true", "false"]) });

// Admins only: adds a coordinator to AV (Technik) or takes them out of it.
export async function changeAvService(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await requireAuth();
  if (!(await isTeamAdmin(supabase))) return { status: "error" };
  const parsed = avChange.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error" };
  await setServesAv(parsed.data.user_id, parsed.data.serves_av === "true");
  refresh();
  return { status: "saved" };
}

const roleChange = z.object({ user_id: z.uuid(), role: z.enum(coordinatorRoles) });

// Admins only: changes another member's role (admin, coordinator, or helper).
// Self-changes are rejected so an admin cannot remove their own access.
export async function changeMemberRole(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await requireAuth();
  if (!(await isTeamAdmin(supabase))) return { status: "error" };
  const parsed = roleChange.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error" };
  const { data: me } = await supabase.auth.getUser();
  if (me.user?.id === parsed.data.user_id) return { status: "error" };
  await setRole(parsed.data.user_id, parsed.data.role);
  refresh();
  return { status: "saved" };
}

const tabListSchema = z.array(z.enum(spaceSections));

// Admins only: updates which workspace tabs coordinators and helpers see.
export async function saveTabPermissions(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await requireAuth();
  if (!(await isTeamAdmin(supabase))) return { status: "error" };
  const parsed = z
    .object({
      coordinator: tabListSchema,
      helper: tabListSchema,
    })
    .safeParse({
      coordinator: form.getAll("coordinator"),
      helper: form.getAll("helper"),
    });
  if (!parsed.success) return { status: "error" };
  await saveRoleTabPermissions(parsed.data);
  refresh();
  return { status: "saved" };
}
