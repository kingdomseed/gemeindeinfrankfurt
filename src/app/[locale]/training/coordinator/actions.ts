"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCoordinatorClient, requireAuth } from "@/lib/auth";

const order = z.object({
  training_id: z.uuid(),
  language: z.enum(["de", "en", "ru"]),
  quantity: z.coerce.number().int().min(0),
});

export async function setOutlineOrder(form: FormData) {
  const supabase = await requireAuth();
  const row = order.parse(Object.fromEntries(form));
  const { error } = await supabase.from("outline_orders").upsert(row);
  if (error) throw error;
  revalidatePath("/[locale]/training/coordinator", "page");
}

export async function signOut() {
  const supabase = await getCoordinatorClient();
  await supabase?.auth.signOut();
}
