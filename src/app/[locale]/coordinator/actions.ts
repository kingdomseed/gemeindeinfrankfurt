"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCoordinatorClient } from "@/lib/auth";

const flag = z.object({
  id: z.uuid(),
  field: z.enum(["fee_paid", "outline_paid"]),
  value: z.boolean(),
});

export async function setPaymentFlag(input: z.infer<typeof flag>) {
  const supabase = await getCoordinatorClient();
  if (!supabase) throw new Error("Not a coordinator");
  const { id, field, value } = flag.parse(input);
  const { error } = await supabase.from("registrations").update({ [field]: value }).eq("id", id);
  if (error) throw error;
  revalidatePath("/[locale]/coordinator", "page");
}

const order = z.object({
  training_id: z.uuid(),
  language: z.enum(["de", "en", "ru"]),
  quantity: z.coerce.number().int().min(0),
});

export async function setOutlineOrder(form: FormData) {
  const supabase = await getCoordinatorClient();
  if (!supabase) throw new Error("Not a coordinator");
  const row = order.parse(Object.fromEntries(form));
  const { error } = await supabase.from("outline_orders").upsert(row);
  if (error) throw error;
  revalidatePath("/[locale]/coordinator", "page");
}

export async function signOut() {
  const supabase = await getCoordinatorClient();
  await supabase?.auth.signOut();
}
