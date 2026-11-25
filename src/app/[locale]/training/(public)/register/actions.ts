"use server";

import type { ActionState } from "@/features/registration/types";
import type { Language } from "@/lib/domain/types";
import { registerPublic } from "@/lib/registrations";

export async function register(
  locale: Language,
  _prev: { status: string },
  form: FormData,
): Promise<ActionState> {
  return registerPublic(locale, form);
}
