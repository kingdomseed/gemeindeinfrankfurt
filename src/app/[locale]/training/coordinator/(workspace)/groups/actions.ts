"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { loadCoordinatorDashboard } from "@/lib/coordinator";
import { suggestGroups } from "@/lib/domain/groups";
import { displayLocality } from "@/lib/domain/locality";
import { moveToGroup, replaceStudyGroups } from "@/lib/groups";

const id = z.uuid();

// Makes the study groups from scratch: by language, then attendance site, 8 to 10 each.
export async function suggestStudyGroups(rawTrainingId: string) {
  const supabase = await requireAuth();
  const trainingId = id.parse(rawTrainingId);
  const data = await loadCoordinatorDashboard(supabase);
  if (data?.training.id !== trainingId) throw new Error("Not the current training");
  const people = data.registrations
    .filter((r) => r.status === "active")
    .map((r) => ({
      id: r.id,
      language: r.group_language,
      locality: r.training_sites?.name ?? displayLocality(r),
    }));
  await replaceStudyGroups(supabase, trainingId, suggestGroups(people));
  refresh();
}

// Puts one person in another group.
export async function moveToStudyGroup(rawRegistrationId: string, rawGroupId: string) {
  const supabase = await requireAuth();
  await moveToGroup(supabase, id.parse(rawRegistrationId), id.parse(rawGroupId));
  refresh();
}
