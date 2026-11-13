"use server";

import { getTrainingById } from "@/lib/data";
import { canCancel, canChangeSeatOrSessions } from "@/lib/domain/cutoffs";
import type { Language } from "@/lib/domain/types";
import { sendCancellation, sendConfirmation } from "@/lib/email/send";
import { findByToken, parseRegistrationForm, replaceSessions, toRow } from "@/lib/registrations";
import { createAdminClient } from "@/lib/supabase/admin";

export type EditState = { status: "idle" | "error" | "saved" | "cancelled" | "locked" };

// react-doctor-disable-next-line react-doctor/server-auth-actions -- registrants have no account; the edit token checked by findByToken is the credential.
export async function updateRegistration(
  token: string,
  locale: Language,
  _prev: { status: string },
  form: FormData,
): Promise<EditState> {
  const existing = await findByToken(token);
  if (!existing || existing.status === "cancelled") return { status: "error" };
  const training = await getTrainingById(existing.training_id);
  const seatLocked = !canChangeSeatOrSessions(training.sessions);

  if (seatLocked) {
    // After the first session starts, seat type and sessions stay as they were.
    form.set("seat_type", existing.seat_type);
    form.delete("session_ids");
    for (const s of existing.registration_sessions) form.append("session_ids", s.session_id);
    if (existing.partner_first_name) form.set("partner_first_name", existing.partner_first_name);
    if (existing.partner_last_name) form.set("partner_last_name", existing.partner_last_name);
  }

  const parsed = parseRegistrationForm(form);
  if (!parsed.success) return { status: "error" };
  const input = parsed.data;
  const allowed = new Set(training.sessions.map((s) => s.id));
  if (!input.session_ids.every((id) => allowed.has(id))) return { status: "error" };

  const { error } = await createAdminClient()
    .from("registrations")
    .update({ ...toRow(input), locale })
    .eq("id", existing.id);
  if (error) throw error;
  if (!seatLocked) await replaceSessions(existing.id, input);

  await sendConfirmation({ locale, training, registration: input, token });
  return { status: "saved" };
}

// react-doctor-disable-next-line react-doctor/server-auth-actions -- registrants have no account; the edit token checked by findByToken is the credential.
export async function cancelRegistration(token: string, locale: Language): Promise<EditState> {
  const existing = await findByToken(token);
  if (!existing || existing.status === "cancelled") return { status: "error" };
  const training = await getTrainingById(existing.training_id);
  if (!canCancel(training.sessions)) return { status: "locked" };

  const { error } = await createAdminClient()
    .from("registrations")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", existing.id);
  if (error) throw error;

  await sendCancellation({
    locale,
    training,
    email: existing.email,
    firstName: existing.first_name,
  });
  return { status: "cancelled" };
}
