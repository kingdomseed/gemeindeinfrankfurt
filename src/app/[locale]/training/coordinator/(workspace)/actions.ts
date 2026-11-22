"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import type { FormState } from "@/features/coordinator/types";
import { getCoordinatorClient, requireAuth } from "@/lib/auth";

const quantity = z.coerce.number().int().min(0).max(10_000);
const order = z.object({ training_id: z.uuid(), de: quantity, en: quantity, ru: quantity });

// How many outlines were ordered from Lebensstrom, per language, in one save.
export async function saveOutlineOrder(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await requireAuth();
  const parsed = order.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error" };
  const { training_id, ...counts } = parsed.data;
  const { error } = await supabase.from("outline_orders").upsert(
    (["de", "en", "ru"] as const).map((language) => ({
      training_id,
      language,
      quantity: counts[language],
    })),
  );
  if (error) throw error;
  refresh();
  return { status: "saved" };
}

export async function signOut() {
  const supabase = await getCoordinatorClient();
  await supabase?.auth.signOut();
  refresh();
}
