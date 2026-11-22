"use server";

import { getLocale } from "next-intl/server";
import { refresh } from "next/cache";
import { z } from "zod";

import type { FormState } from "@/features/coordinator/types";
import { requireLocale } from "@/i18n/locale";
import { requireAuth } from "@/lib/auth";
import {
  addCoordinator,
  isTeamAdmin,
  loadTeam,
  removeCoordinator,
  sendSignInLink,
} from "@/lib/team";

const newMember = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().trim().toLowerCase(),
});

// Admins only: gives someone coordinator access and emails them a sign-in link.
export async function inviteCoordinator(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await requireAuth();
  if (!(await isTeamAdmin(supabase))) return { status: "error" };
  const parsed = newMember.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error" };
  await addCoordinator(parsed.data.name, parsed.data.email);
  await sendSignInLink(parsed.data.email, requireLocale(await getLocale()));
  refresh();
  return { status: "saved" };
}

const member = z.object({ user_id: z.uuid() });

// Sends a coordinator a fresh sign-in link, for example when the first one expired.
export async function resendSignInLink(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await requireAuth();
  const parsed = member.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error" };
  const target = (await loadTeam(supabase)).find((m) => m.userId === parsed.data.user_id);
  if (!target?.email) return { status: "error" };
  await sendSignInLink(target.email, requireLocale(await getLocale()));
  return { status: "saved" };
}

// Admins only: takes away someone else's coordinator access.
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
