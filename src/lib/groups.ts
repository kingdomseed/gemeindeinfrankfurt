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
// saves the suggested ones.
export async function replaceStudyGroups(
  supabase: CoordinatorClient,
  trainingId: string,
  suggested: readonly SuggestedGroup[],
) {
  const removed = await supabase.from("study_groups").delete().eq("training_id", trainingId);
  if (removed.error) throw removed.error;
  if (suggested.length === 0) return;
  const { data, error } = await supabase
    .from("study_groups")
    .insert(
      suggested.map((g, i) => ({
        training_id: trainingId,
        name: String(i + 1),
        language: g.language,
        sort_order: i + 1,
      })),
    )
    .select("id, sort_order");
  if (error) throw error;
  const idByOrder = new Map(data.map((g) => [g.sort_order, g.id]));
  const members = suggested.flatMap((g, i) =>
    g.memberIds.map((registration_id) => ({
      group_id: idByOrder.get(i + 1) ?? "",
      registration_id,
    })),
  );
  if (members.length === 0) return;
  const added = await supabase.from("study_group_members").insert(members);
  if (added.error) throw added.error;
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
// in their language. Nothing happens while there are no groups.
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
  const group = smallestGroup(groups, registration.language);
  if (!group) return;
  const added = await db
    .from("study_group_members")
    .insert({ group_id: group.id, registration_id: registration.id });
  if (added.error) throw added.error;
}
