"use server";

import { getTranslations } from "next-intl/server";
import { refresh } from "next/cache";
import { z } from "zod";

import type { FormState } from "@/features/coordinator/types";
import {
  getCoordinatorClient,
  loadAccessContext,
  requireAuth,
  requireSectionAuth,
} from "@/lib/auth";
import {
  defaultLinkTitle,
  detectLinkKind,
  parseExternalLinkUrl,
  spaceSections,
} from "@/lib/domain/links";
import { canAccessSection } from "@/lib/domain/roles";
import { addTrainingLink, loadTrainingLinkSection, removeTrainingLink } from "@/lib/links";

const id = z.uuid();
const saveStatus = z.enum(["saved", "stale"]);
const quantity = z.coerce.number().int().min(0).max(10_000);
const order = z.object({
  training_id: z.uuid(),
  de: quantity,
  en: quantity,
  ru: quantity,
  version: z.string().optional(),
});

// How many outlines were ordered from Lebensstrom, per language, in one atomic save.
export async function saveOutlineOrder(_prev: FormState, form: FormData): Promise<FormState> {
  const supabase = await requireSectionAuth("outlines");
  const parsed = order.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error" };
  const { training_id, version, ...counts } = parsed.data;
  const { data, error } = await supabase.rpc("save_outline_orders", {
    p_training: training_id,
    p_de: counts.de,
    p_en: counts.en,
    p_ru: counts.ru,
    ...(version !== undefined ? { p_expected_version: version } : {}),
  });
  if (error) throw error;
  const status = saveStatus.parse(data);
  refresh();
  return { status };
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
  const trainingId = id.parse(rawTrainingId);
  const parsed = linkSchema.safeParse({
    section: form.get("section"),
    url: form.get("url") ?? "",
    title: form.get("title") ?? "",
  });
  if (!parsed.success) return { status: "error" };
  const supabase = await requireSectionAuth(parsed.data.section);
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
  const section = await loadTrainingLinkSection(supabase, linkId);
  if (section) {
    const access = await loadAccessContext(supabase);
    if (
      !access.currentUser ||
      !canAccessSection(access.currentUser.role, access.permissions, section)
    ) {
      throw new Error("Forbidden");
    }
  }
  await removeTrainingLink(supabase, linkId);
  refresh();
}

export async function signOut() {
  const supabase = await getCoordinatorClient();
  await supabase?.auth.signOut();
  refresh();
}
