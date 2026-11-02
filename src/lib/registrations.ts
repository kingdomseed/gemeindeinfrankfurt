import "server-only";
import { z } from "zod";

import { hashToken } from "@/lib/domain/token";
import { createAdminClient } from "@/lib/supabase/admin";

const language = z.enum(["de", "en", "ru"]);

export const registrationSchema = z
  .object({
    seat_type: z.enum(["full_time", "part_time", "shared"]),
    session_ids: z.array(z.uuid()).default([]),
    first_name: z.string().trim().min(1).max(100),
    last_name: z.string().trim().min(1).max(100),
    partner_first_name: z.string().trim().max(100).optional(),
    partner_last_name: z.string().trim().max(100).optional(),
    email: z.email().max(200),
    phone: z.string().trim().max(50).default(""),
    group_language: language,
    outline_language: language,
    second_outline_language: language.nullable(),
    comments: z.string().trim().max(2000).default(""),
    attended_anaheim: z.boolean(),
    ukraine_not_employed: z.boolean(),
    confirmed_adult: z.literal(true),
    accepted_rules: z.literal(true),
  })
  .refine((r) => r.seat_type !== "shared" || (r.partner_first_name && r.partner_last_name), {
    path: ["partner_first_name"],
  })
  .refine((r) => r.seat_type !== "part_time" || r.session_ids.length > 0, {
    path: ["session_ids"],
  })
  .refine((r) => r.second_outline_language !== r.outline_language, {
    path: ["second_outline_language"],
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;

export function parseRegistrationForm(form: FormData) {
  const text = (name: string) => {
    const v = form.get(name);
    return typeof v === "string" ? v : undefined;
  };
  const seatType = text("seat_type");
  return registrationSchema.safeParse({
    seat_type: seatType,
    session_ids: seatType === "part_time" ? form.getAll("session_ids") : [],
    first_name: text("first_name"),
    last_name: text("last_name"),
    partner_first_name: seatType === "shared" ? text("partner_first_name") : undefined,
    partner_last_name: seatType === "shared" ? text("partner_last_name") : undefined,
    email: text("email")?.trim().toLowerCase(),
    phone: text("phone"),
    group_language: text("group_language"),
    outline_language: text("outline_language"),
    second_outline_language: text("second_outline_language") || null,
    comments: text("comments"),
    attended_anaheim: form.get("attended_anaheim") === "on",
    ukraine_not_employed: form.get("ukraine_not_employed") === "on",
    confirmed_adult: form.get("confirmed_adult") === "on",
    accepted_rules: form.get("accepted_rules") === "on",
  });
}

export async function findByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const { data, error } = await createAdminClient()
    .from("registrations")
    .select("*, registration_sessions(session_id)")
    .eq("edit_token_hash", hashToken(token))
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function hasPossibleDuplicate(trainingId: string, r: RegistrationInput) {
  const { count, error } = await createAdminClient()
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("training_id", trainingId)
    .eq("status", "active")
    .ilike("email", r.email)
    .ilike("first_name", r.first_name)
    .ilike("last_name", r.last_name);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export function toRow(r: RegistrationInput) {
  const { session_ids: _sessionIds, partner_first_name, partner_last_name, ...row } = r;
  const shared = r.seat_type === "shared";
  return {
    ...row,
    partner_first_name: shared ? (partner_first_name ?? null) : null,
    partner_last_name: shared ? (partner_last_name ?? null) : null,
  };
}

export async function replaceSessions(registrationId: string, r: RegistrationInput) {
  const db = createAdminClient();
  const del = await db.from("registration_sessions").delete().eq("registration_id", registrationId);
  if (del.error) throw del.error;
  if (r.seat_type !== "part_time") return;
  const ins = await db
    .from("registration_sessions")
    .insert(r.session_ids.map((session_id) => ({ registration_id: registrationId, session_id })));
  if (ins.error) throw ins.error;
}
