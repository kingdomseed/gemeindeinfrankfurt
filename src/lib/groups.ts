import "server-only";
import type { CoordinatorClient } from "@/lib/auth";
import { pickStudyGroup, type SuggestedGroup } from "@/lib/domain/groups";
import type { Language } from "@/lib/domain/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type StudyGroup = {
  id: string;
  number: number;
  language: Language;
  memberIds: string[];
};

// A training's study groups in order, each with its members' registration ids.
export async function loadStudyGroups(
  supabase: CoordinatorClient,
  trainingId: string,
): Promise<StudyGroup[]> {
  const { data, error } = await supabase
    .from("study_groups")
    .select("id, language, sort_order, study_group_members(registration_id)")
    .eq("training_id", trainingId)
    .order("sort_order");
  if (error) throw error;
  return data.map((g, i) => ({
    id: g.id,
    number: i + 1,
    language: g.language,
    memberIds: g.study_group_members.map((m) => m.registration_id),
  }));
}

// Throws away the training's groups (and the tests planned for them) and
// saves the suggested ones, all at once.
export async function replaceStudyGroups(
  supabase: CoordinatorClient,
  trainingId: string,
  suggested: readonly SuggestedGroup[],
) {
  const { error } = await supabase.rpc("replace_study_groups", {
    p_training: trainingId,
    p_groups: suggested.map((g) => ({
      language: g.language,
      site_id: g.siteId,
      members: g.memberIds,
    })),
  });
  if (error) throw error;
}

// Creates a new empty study group at the end of the training's list.
export async function createEmptyStudyGroup(
  supabase: CoordinatorClient,
  trainingId: string,
  language: Language,
) {
  const { data: existing, error: readError } = await supabase
    .from("study_groups")
    .select("sort_order")
    .eq("training_id", trainingId);
  if (readError) throw readError;
  const next = Math.max(0, ...existing.map((g) => g.sort_order)) + 1;
  const { error } = await supabase
    .from("study_groups")
    .insert({ training_id: trainingId, name: String(next), language, sort_order: next });
  if (error) throw error;
}

// Updates a study group's language manually from the groups board.
export async function updateStudyGroupLanguage(
  supabase: CoordinatorClient,
  trainingId: string,
  groupId: string,
  language: Language,
) {
  const { error } = await supabase
    .from("study_groups")
    .update({ language })
    .eq("id", groupId)
    .eq("training_id", trainingId);
  if (error) throw error;
}

// Deletes a study group only when it has no active assigned registrations.
// Cancelled registrations still in study_group_members cascade-delete with the group.
export async function deleteEmptyStudyGroup(
  supabase: CoordinatorClient,
  trainingId: string,
  groupId: string,
): Promise<{ deleted: true } | { deleted: false; reason: "not_empty" }> {
  const { data: members, error: checkError } = await supabase
    .from("study_group_members")
    .select("registration_id, registrations!inner(status)")
    .eq("group_id", groupId);
  if (checkError) throw checkError;
  if (members.some((m) => m.registrations.status === "active")) {
    return { deleted: false, reason: "not_empty" };
  }
  const { error } = await supabase
    .from("study_groups")
    .delete()
    .eq("id", groupId)
    .eq("training_id", trainingId);
  if (error) throw error;
  return { deleted: true };
}

// Puts a registration in a group, out of any other one.
export async function moveToGroup(
  supabase: CoordinatorClient,
  registrationId: string,
  groupId: string,
) {
  const { error } = await supabase
    .from("study_group_members")
    .upsert(
      { group_id: groupId, registration_id: registrationId },
      { onConflict: "registration_id" },
    );
  if (error) throw error;
}

// Someone who registers after the groups were made joins the smallest group
// in their language (or site group when attending at a separate site), or a new
// group when theirs has none yet. Nothing happens while there are no groups at all.
export async function placeInStudyGroup(registration: {
  id: string;
  trainingId: string;
  language: Language;
  siteId?: string | null | undefined;
  siteName?: string | null | undefined;
}) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("study_groups")
    .select("id, language, site_id, sort_order, study_group_members(registrations(status))")
    .eq("training_id", registration.trainingId)
    .order("sort_order");
  if (error) throw error;
  const groups = data.map((g) => ({
    id: g.id,
    language: g.language,
    siteId: g.site_id,
    size: g.study_group_members.filter((m) => m.registrations.status === "active").length,
  }));
  if (groups.length === 0) return;
  const picked = pickStudyGroup(groups, {
    language: registration.language,
    siteId: registration.siteId ?? null,
    siteName: registration.siteName ?? null,
  });
  const groupId =
    picked.group?.id ??
    (await addStudyGroup(
      registration.trainingId,
      registration.language,
      picked.createSiteId,
      data,
    ));
  const added = await db
    .from("study_group_members")
    .insert({ group_id: groupId, registration_id: registration.id });
  if (added.error) throw added.error;
}

async function addStudyGroup(
  trainingId: string,
  language: Language,
  siteId: string | null,
  existing: readonly { sort_order: number }[],
) {
  const next = Math.max(0, ...existing.map((g) => g.sort_order)) + 1;
  const { data, error } = await createAdminClient()
    .from("study_groups")
    .insert({
      training_id: trainingId,
      name: String(next),
      language,
      site_id: siteId,
      sort_order: next,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}
