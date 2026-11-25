import "server-only";
import { z } from "zod";

import type { TrainingWithSessions } from "@/lib/data";
import { resolveLocalityInput } from "@/lib/domain/locality";
import { hashToken } from "@/lib/domain/token";
import { picksSessions } from "@/lib/domain/types";
import { createAdminClient } from "@/lib/supabase/admin";

const language = z.enum(["de", "en", "ru"]);
const seatType = z.enum(["full_time", "part_time", "shared", "anaheim"]);

export const registrationSchema = z
  .object({
    seat_type: seatType,
    session_ids: z.array(z.uuid()).default([]),
    first_name: z.string().trim().min(1).max(100),
    last_name: z.string().trim().min(1).max(100),
    partner_first_name: z.string().trim().max(100).optional(),
    partner_last_name: z.string().trim().max(100).optional(),
    email: z.email().max(200),
    phone: z.string().trim().max(50).default(""),
    locality_id: z.uuid().nullable(),
    other_locality: z.string().trim().max(100).default(""),
    site_id: z.uuid().nullable(),
    group_language: language,
    outline_language: language.nullable(),
    second_outline_language: language.nullable(),
    comments: z.string().trim().max(2000).default(""),
    confirmed_adult: z.literal(true),
    accepted_rules: z.literal(true),
  })
  .refine((r) => r.seat_type !== "shared" || (r.partner_first_name && r.partner_last_name), {
    path: ["partner_first_name"],
  })
  .refine((r) => r.seat_type !== "part_time" || r.session_ids.length > 0, {
    path: ["session_ids"],
  })
  // Either a curated locality is picked or "Other" is typed, never both.
  .refine((r) => r.locality_id === null || r.other_locality === "", {
    path: ["other_locality"],
  })
  .refine((r) => (r.locality_id !== null) !== r.other_locality.length > 0, {
    path: ["locality_id"],
  })
  // Anaheim attendees already have their outlines; everyone else orders one.
  .refine((r) => (r.seat_type === "anaheim") === (r.outline_language === null), {
    path: ["outline_language"],
  })
  .refine(
    (r) =>
      r.second_outline_language === null ||
      (r.outline_language !== null && r.second_outline_language !== r.outline_language),
    { path: ["second_outline_language"] },
  );

export type RegistrationInput = z.infer<typeof registrationSchema>;

export function parseRegistrationForm(form: FormData) {
  const text = (name: string) => {
    const v = form.get(name);
    return typeof v === "string" ? v : undefined;
  };
  const seat = seatType.safeParse(text("seat_type")).data;
  const anaheim = seat === "anaheim";
  const rawLocality = text("locality");
  const isOtherLocality = rawLocality === "other";
  return registrationSchema.safeParse({
    seat_type: seat,
    session_ids: seat && picksSessions(seat) ? form.getAll("session_ids") : [],
    first_name: text("first_name"),
    last_name: text("last_name"),
    partner_first_name: seat === "shared" ? text("partner_first_name") : undefined,
    partner_last_name: seat === "shared" ? text("partner_last_name") : undefined,
    email: text("email")?.trim().toLowerCase(),
    phone: text("phone"),
    locality_id: isOtherLocality ? null : rawLocality || null,
    other_locality: isOtherLocality ? (text("other_locality") ?? "") : "",
    site_id: text("site_id") || null,
    group_language: text("group_language"),
    outline_language: anaheim ? null : text("outline_language"),
    second_outline_language: anaheim ? null : text("second_outline_language") || null,
    comments: text("comments"),
    confirmed_adult: form.get("confirmed_adult") === "on",
    accepted_rules: form.get("accepted_rules") === "on",
  });
}

// Checks submitted sessions, locality and attendance site against the training's
// own options, normalizing an "Other" entry that matches a listed city.
export function validateForTraining(
  input: RegistrationInput,
  training: TrainingWithSessions,
): RegistrationInput | null {
  const allowedSessions = new Set(training.sessions.map((s) => s.id));
  if (!input.session_ids.every((id) => allowedSessions.has(id))) return null;

  const locality = resolveLocalityInput(
    input.locality_id,
    input.other_locality,
    training.localities,
  );
  if (!locality) return null;

  const siteOk =
    input.site_id !== null
      ? training.sites.some((s) => s.id === input.site_id)
      : training.sites.length === 0;
  if (!siteOk) return null;

  return { ...input, ...locality };
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
  if (!picksSessions(r.seat_type) || r.session_ids.length === 0) return;
  const ins = await db
    .from("registration_sessions")
    .insert(r.session_ids.map((session_id) => ({ registration_id: registrationId, session_id })));
  if (ins.error) throw ins.error;
}
