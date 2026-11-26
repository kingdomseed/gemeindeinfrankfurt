"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { requireSectionAuth } from "@/lib/auth";
import { loadCoordinatorDashboard } from "@/lib/coordinator";
import { suggestGroups } from "@/lib/domain/groups";
import { displayLocality } from "@/lib/domain/locality";
import {
  createEmptyStudyGroup,
  deleteEmptyStudyGroup,
  moveToGroup,
  replaceStudyGroups,
  updateStudyGroupLanguage,
} from "@/lib/groups";

const id = z.uuid();
const languageSchema = z.enum(["de", "en", "ru"]);

async function requireTraining(rawTrainingId: string) {
  const supabase = await requireSectionAuth("groups");
  const trainingId = id.parse(rawTrainingId);
  const data = await loadCoordinatorDashboard(supabase);
  if (data?.training.id !== trainingId) throw new Error("Not the current training");
  return { supabase, trainingId, data };
}

// Makes the study groups from scratch: keeps Mannheim/Heidelberg separate,
// otherwise by language then locality, 8 to 10 each.
export async function suggestStudyGroups(rawTrainingId: string) {
  const { supabase, trainingId, data } = await requireTraining(rawTrainingId);
  const people = data.registrations
    .filter((r) => r.status === "active")
    .map((r) => ({
      id: r.id,
      language: r.group_language,
      locality: r.training_sites?.name ?? displayLocality(r),
      siteId: r.site_id,
      siteName: r.training_sites?.name ?? null,
    }));
  await replaceStudyGroups(supabase, trainingId, suggestGroups(people));
  refresh();
}

// Creates a new empty study group for manual assignment.
export async function addEmptyStudyGroup(rawTrainingId: string) {
  const { supabase, trainingId } = await requireTraining(rawTrainingId);
  await createEmptyStudyGroup(supabase, trainingId, "en");
  refresh();
}

// Changes a study group's language manually.
export async function changeStudyGroupLanguage(
  rawTrainingId: string,
  rawGroupId: string,
  rawLanguage: string,
) {
  const { supabase, trainingId } = await requireTraining(rawTrainingId);
  await updateStudyGroupLanguage(
    supabase,
    trainingId,
    id.parse(rawGroupId),
    languageSchema.parse(rawLanguage),
  );
  refresh();
}

// Removes a study group when it has no active assigned members.
export async function removeEmptyStudyGroup(
  rawTrainingId: string,
  rawGroupId: string,
): Promise<{ ok: true } | { ok: false; error: "not_empty" }> {
  const { supabase, trainingId } = await requireTraining(rawTrainingId);
  const res = await deleteEmptyStudyGroup(supabase, trainingId, id.parse(rawGroupId));
  if (!res.deleted) return { ok: false, error: res.reason };
  refresh();
  return { ok: true };
}

// Puts one person in another group.
export async function moveToStudyGroup(rawRegistrationId: string, rawGroupId: string) {
  const supabase = await requireSectionAuth("groups");
  await moveToGroup(supabase, id.parse(rawRegistrationId), id.parse(rawGroupId));
  refresh();
}
