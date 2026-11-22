"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth";
import { setTestGroup } from "@/lib/testing";

const slot = z.object({
  session_id: z.uuid(),
  group_id: z.union([z.uuid(), z.literal("")]),
});

// Saves which group tests before a message, as soon as it is picked.
export async function saveTestSlot(form: FormData) {
  const supabase = await requireAuth();
  const parsed = slot.parse(Object.fromEntries(form));
  await setTestGroup(supabase, parsed.session_id, parsed.group_id || null);
  refresh();
}
