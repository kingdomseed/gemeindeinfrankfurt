"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCoordinatorClient, requireAuth } from "@/lib/auth";

const flag = z.object({
  id: z.uuid(),
  field: z.enum(["fee_paid", "outline_paid"]),
  value: z.boolean(),
});

export async function setPaymentFlag(input: z.infer<typeof flag>) {
  const supabase = await requireAuth();
  const { id, field, value } = flag.parse(input);
  const change = field === "fee_paid" ? { fee_paid: value } : { outline_paid: value };
  const { error } = await supabase.from("registrations").update(change).eq("id", id);
  if (error) throw error;
  revalidatePath("/[locale]/training/coordinator", "page");
}

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
