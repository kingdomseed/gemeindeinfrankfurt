"use server";

import { checkBotId } from "botid/server";

import type { ActionState } from "@/features/registration/types";
import { calendarUrl } from "@/lib/calendar";
import { getPublishedTraining } from "@/lib/data";
import { canRegister } from "@/lib/domain/cutoffs";
import { newEditToken } from "@/lib/domain/token";
import type { Language } from "@/lib/domain/types";
import { sendConfirmation } from "@/lib/email/send";
import { placeInStudyGroup } from "@/lib/groups";
import {
  hasPossibleDuplicate,
  parseRegistrationForm,
  replaceSessions,
  toRow,
} from "@/lib/registrations";
import { createAdminClient } from "@/lib/supabase/admin";

export async function register(
  locale: Language,
  _prev: { status: string },
  form: FormData,
): Promise<ActionState> {
  const verification = await checkBotId();
  if (verification.isBot) return { status: "error" };

  const training = await getPublishedTraining();
  if (!training || !canRegister(training.sessions)) return { status: "closed" };

  const parsed = parseRegistrationForm(form);
  if (!parsed.success) return { status: "error" };
  const input = parsed.data;

  const allowed = new Set(training.sessions.map((s) => s.id));
  if (!input.session_ids.every((id) => allowed.has(id))) return { status: "error" };

  if (form.get("confirm_duplicate") !== "on" && (await hasPossibleDuplicate(training.id, input))) {
    return { status: "duplicate" };
  }

  const { token, hash } = newEditToken();
  const { data, error } = await createAdminClient()
    .from("registrations")
    .insert({ ...toRow(input), training_id: training.id, locale, edit_token_hash: hash })
    .select("id")
    .single();
  if (error) throw error;
  await replaceSessions(data.id, input);
  // A missing group place is fixed by hand on the groups page; it must not
  // stop the registration.
  await placeInStudyGroup({
    id: data.id,
    trainingId: training.id,
    language: input.group_language,
  }).catch((placeError: unknown) => {
    console.error("Could not place the registration in a study group", placeError);
  });

  await sendConfirmation({ locale, training, registration: input, token, waived: false });
  return { status: "done", calendarUrl: calendarUrl(locale, token) };
}
