import "server-only";
import { smallestGroup, type SuggestedGroup } from "@/lib/domain/groups";
import { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";

type CoordinatorClient = Awaited<ReturnType<typeof createClient>>;

export type StudyGroup = {
  id: string;
  number: number;
  language: "de" | "en" | "ru";
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
    p_groups: suggested.map((g) => ({ language: g.language, members: g.memberIds })),
  });
  if (error) throw error;
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
// in their language, or a new group when theirs has none yet. Nothing
// happens while there are no groups at all.
export async function placeInStudyGroup(registration: {
  id: string;
  trainingId: string;
  language: "de" | "en" | "ru";
}) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("study_groups")
    .select("id, language, sort_order, study_group_members(registrations(status))")
    .eq("training_id", registration.trainingId)
    .order("sort_order");
  if (error) throw error;
  const groups = data.map((g) => ({
    id: g.id,
    language: g.language,
    size: g.study_group_members.filter((m) => m.registrations.status === "active").length,
  }));
  if (groups.length === 0) return;
  const groupId =
    smallestGroup(groups, registration.language)?.id ??
    (await addStudyGroup(registration.trainingId, registration.language, data));
  const added = await db
    .from("study_group_members")
    .insert({ group_id: groupId, registration_id: registration.id });
  if (added.error) throw added.error;
}

async function addStudyGroup(
  trainingId: string,
  language: "de" | "en" | "ru",
  existing: readonly { sort_order: number }[],
) {
  const next = Math.max(0, ...existing.map((g) => g.sort_order)) + 1;
  const { data, error } = await createAdminClient()
    .from("study_groups")
    .insert({ training_id: trainingId, name: String(next), language, sort_order: next })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}
