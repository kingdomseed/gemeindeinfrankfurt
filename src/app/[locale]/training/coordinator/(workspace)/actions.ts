"use server";

import { getTranslations } from "next-intl/server";
import { refresh } from "next/cache";
import { z } from "zod";

import type { FormState } from "@/features/coordinator/types";
import { getCoordinatorClient, requireAuth } from "@/lib/auth";
import {
  defaultLinkTitle,
  detectLinkKind,
  parseExternalLinkUrl,
  spaceSections,
} from "@/lib/domain/links";
import { outlineOrdersFingerprint } from "@/lib/domain/list-sync";
import { addTrainingLink, removeTrainingLink } from "@/lib/links";

const id = z.uuid();
const quantity = z.coerce.number().int().min(0).max(10_000);
const order = z.object({
  training_id: z.uuid(),
  de: quantity,
  en: quantity,
  ru: quantity,
  version: z.string().optional(),
});

// How many outlines were ordered from Lebensstrom, per language, in one save.
export async function saveOutlineOrder(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await requireAuth();
  const parsed = order.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error" };
  const { training_id, version, ...counts } = parsed.data;
  if (version !== undefined) {
    const { data: current, error: readError } = await supabase
      .from("outline_orders")
      .select("language, quantity")
      .eq("training_id", training_id);
    if (readError) throw readError;
    const map = { de: 0, en: 0, ru: 0 };
    for (const row of current) map[row.language] = row.quantity;
    if (outlineOrdersFingerprint(map) !== version) {
      refresh();
      return { status: "stale" };
    }
  }
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

const linkSchema = z.object({
  section: z.enum(spaceSections),
  url: z.string().trim().max(2000),
  title: z.string().trim().max(120),
});

// Attaches a shared external link (Google Doc / Sheet / Slides / URL) to one coordinator space.
export async function addSpaceLink(
  rawTrainingId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const supabase = await requireAuth();
  const trainingId = id.parse(rawTrainingId);
  const parsed = linkSchema.safeParse({
    section: form.get("section"),
    url: form.get("url") ?? "",
    title: form.get("title") ?? "",
  });
  if (!parsed.success) return { status: "error" };
  const url = parseExternalLinkUrl(parsed.data.url);
  if (!url) {
    const t = await getTranslations("coordinator.links");
    return { status: "error", message: t("invalidUrl") };
  }
  const title = parsed.data.title || defaultLinkTitle(url, detectLinkKind(url));
  await addTrainingLink(supabase, trainingId, { section: parsed.data.section, title, url });
  refresh();
  return { status: "saved" };
}

export async function removeSpaceLink(form: FormData) {
  const supabase = await requireAuth();
  const linkId = id.parse(form.get("id"));
  await removeTrainingLink(supabase, linkId);
  refresh();
}

export async function signOut() {
  const supabase = await getCoordinatorClient();
  await supabase?.auth.signOut();
  refresh();
}
