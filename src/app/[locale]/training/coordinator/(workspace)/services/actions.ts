"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import type { FormState } from "@/features/coordinator/types";
import { requireSectionAuth } from "@/lib/auth";
import { revealWebcastPassword, saveWebcastLogin } from "@/lib/services";

const id = z.uuid();

const lead = z.object({ id: z.uuid(), lead: z.string().trim().max(200) });

// Saves who leads a service.
export async function setServiceLead(form: FormData) {
  const supabase = await requireSectionAuth("services");
  const parsed = lead.parse(Object.fromEntries(form));
  const { error } = await supabase
    .from("services")
    .update({ lead: parsed.lead })
    .eq("id", parsed.id);
  if (error) throw error;
  refresh();
}

const newService = z.object({ name: z.string().trim().min(1).max(100) });

// Adds a service at the end of the list.
export async function addService(rawTrainingId: string, form: FormData) {
  const supabase = await requireSectionAuth("services");
  const trainingId = id.parse(rawTrainingId);
  const parsed = newService.parse(Object.fromEntries(form));
  const { data: last } = await supabase
    .from("services")
    .select("sort_order")
    .eq("training_id", trainingId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("services").insert({
    training_id: trainingId,
    name: parsed.name,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) throw error;
  refresh();
}

// Removes a service.
export async function removeService(form: FormData) {
  const supabase = await requireSectionAuth("services");
  const serviceId = id.parse(form.get("id"));
  const { error } = await supabase.from("services").delete().eq("id", serviceId);
  if (error) throw error;
  refresh();
}

// The webcast password, for a coordinator serving in AV. Logged each time.
export async function showWebcastPassword(rawTrainingId: string) {
  const supabase = await requireSectionAuth("services");
  return revealWebcastPassword(supabase, id.parse(rawTrainingId));
}

const login = z.object({
  website: z.url().max(500),
  user_name: z.string().trim().min(1).max(200),
  password: z.string().max(200),
});

// Stores a new webcast login from Lebensstrom. Only AV coordinators may.
export async function updateWebcastLogin(
  rawTrainingId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const supabase = await requireSectionAuth("services");
  const { data: av } = await supabase.rpc("serves_av");
  if (av !== true) return { status: "error" };
  const parsed = login.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error" };
  await saveWebcastLogin(supabase, id.parse(rawTrainingId), {
    website: parsed.data.website,
    userName: parsed.data.user_name,
    password: parsed.data.password,
  });
  refresh();
  return { status: "saved" };
}
