"use server";

import { getTranslations } from "next-intl/server";
import { refresh } from "next/cache";
import { z } from "zod";

import type { FormState } from "@/features/coordinator/types";
import { requireAuth } from "@/lib/auth";
import { parseEuroCents } from "@/lib/domain/report";
import {
  addReimbursement,
  attachReceipt,
  removeReimbursement,
  saveAnswer,
  saveReportDetails,
  type ReportQuestion,
} from "@/lib/report";

const id = z.uuid();
const day = z.union([z.literal(""), z.iso.date()]).transform((d) => d || null);
const question = z.enum(["tested", "absencesLimited", "nameTags", "seatsAssigned", "inPerson"]);
const MAX_PHOTO = 5 * 1024 * 1024;
const photo = z
  .instanceof(File)
  .refine((f) => f.size <= MAX_PHOTO && ["image/jpeg", "image/png", "image/webp"].includes(f.type))
  .nullable();

function photoOf(form: FormData) {
  const value = form.get("photo");
  return value instanceof File && value.size > 0 ? value : null;
}

// Answers one yes/no question of the questionnaire.
export async function answerQuestion(
  rawTrainingId: string,
  rawQuestion: ReportQuestion,
  answer: boolean,
) {
  const supabase = await requireAuth();
  await saveAnswer(
    supabase,
    id.parse(rawTrainingId),
    question.parse(rawQuestion),
    z.boolean().parse(answer),
  );
  refresh();
}

// The notes for Lebensstrom and the actual first and last day, when they
// differ from the schedule.
export async function saveDetails(
  rawTrainingId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const supabase = await requireAuth();
  const details = z
    .object({ notes: z.string().trim().max(4000), firstDay: day, lastDay: day })
    .safeParse({
      notes: form.get("notes") ?? "",
      firstDay: form.get("first_day") ?? "",
      lastDay: form.get("last_day") ?? "",
    });
  if (!details.success) return { status: "error" };
  await saveReportDetails(supabase, id.parse(rawTrainingId), details.data);
  refresh();
  return { status: "saved" };
}

export async function addCost(
  rawTrainingId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const t = await getTranslations("coordinator.report");
  const supabase = await requireAuth();
  const amount = form.get("amount");
  const amountCents = typeof amount === "string" ? parseEuroCents(amount) : null;
  if (amountCents === null) return { status: "error", message: t("amountInvalid") };
  const cost = z
    .object({
      description: z.string().trim().min(1).max(200),
      paidBy: z.string().trim().max(200),
      paidOn: day,
      photo,
    })
    .safeParse({
      description: form.get("description") ?? "",
      paidBy: form.get("paid_by") ?? "",
      paidOn: form.get("paid_on") ?? "",
      photo: photoOf(form),
    });
  if (!cost.success) return { status: "error", message: t("costInvalid") };
  await addReimbursement(supabase, id.parse(rawTrainingId), { ...cost.data, amountCents });
  refresh();
  return { status: "saved" };
}

export async function addPhoto(
  rawId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const t = await getTranslations("coordinator.report");
  const supabase = await requireAuth();
  const file = photo.safeParse(photoOf(form));
  if (!file.success || !file.data) return { status: "error", message: t("photoInvalid") };
  await attachReceipt(supabase, id.parse(rawId), file.data);
  refresh();
  return { status: "saved" };
}

export async function removeCost(form: FormData) {
  const supabase = await requireAuth();
  await removeReimbursement(supabase, id.parse(form.get("id")));
  refresh();
}
