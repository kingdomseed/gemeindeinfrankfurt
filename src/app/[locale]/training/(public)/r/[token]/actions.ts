"use server";

import { refresh } from "next/cache";

import type { ActionState, CancelState } from "@/features/registration/types";
import type { Language } from "@/lib/domain/types";
import { cancelByToken, updateByToken } from "@/lib/registrations";

// react-doctor-disable-next-line react-doctor/server-auth-actions -- registrants have no account; the edit token checked by findByToken is the credential.
export async function updateRegistration(
  token: string,
  locale: Language,
  _prev: { status: string },
  form: FormData,
): Promise<ActionState> {
  const result = await updateByToken(token, locale, form);
  // The payment panel and concurrency version come from the saved row on the server.
  if (result.status === "saved" || result.status === "stale") refresh();
  return result;
}

// react-doctor-disable-next-line react-doctor/server-auth-actions -- registrants have no account; the edit token checked by findByToken is the credential.
export async function cancelRegistration(token: string, locale: Language): Promise<CancelState> {
  const result = await cancelByToken(token, locale);
  if (result.status === "cancelled") refresh();
  return result;
}
