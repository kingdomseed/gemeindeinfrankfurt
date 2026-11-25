"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import type { FormState } from "@/features/coordinator/types";
import { requireAuth } from "@/lib/auth";
import { saveHymns, saveVerses } from "@/lib/messages";

const id = z.uuid();
const number = z.string().trim().max(20);
const all = (form: FormData, name: string) => z.array(z.string()).parse(form.getAll(name));

// Saves a message's hymns in the order they are listed. An empty German or
// Russian number means the hymn does not exist in that language.
export async function saveMessageHymns(
  rawSessionId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const supabase = await requireAuth();
  const sessionId = id.parse(rawSessionId);
  const en = all(form, "en");
  const de = all(form, "de");
  const ru = all(form, "ru");
  const hymns = z
    .array(z.object({ en: number.min(1), de: number, ru: number }))
    .max(30)
    .safeParse(en.map((value, i) => ({ en: value, de: de[i] ?? "", ru: ru[i] ?? "" })));
  if (!hymns.success) return { status: "error" };

  const version = form.get("version");
  const status = await saveHymns(
    supabase,
    sessionId,
    hymns.data.map((h) => ({ en: h.en, de: h.de || null, ru: h.ru || null })),
    typeof version === "string" ? version : undefined,
  );
  if (status === "error") return { status: "error" };
  refresh();
  return { status };
}

const text = z.string().trim().max(4000);

// Saves a message's verses in reading order, with their text per language.
export async function saveMessageVerses(
  rawSessionId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const supabase = await requireAuth();
  const sessionId = id.parse(rawSessionId);
  const refs = all(form, "ref");
  const [de, en, ru] = (["text_de", "text_en", "text_ru"] as const).map((n) => all(form, n));
  const verses = z
    .array(z.object({ ref: z.string().trim().min(1).max(100), de: text, en: text, ru: text }))
    .max(40)
    .safeParse(
      refs.map((ref, i) => ({ ref, de: de?.[i] ?? "", en: en?.[i] ?? "", ru: ru?.[i] ?? "" })),
    );
  if (!verses.success) return { status: "error" };

  const version = form.get("version");
  const status = await saveVerses(
    supabase,
    sessionId,
    verses.data.map((v) => ({
      ref: v.ref,
      text: {
        ...(v.de ? { de: v.de } : {}),
        ...(v.en ? { en: v.en } : {}),
        ...(v.ru ? { ru: v.ru } : {}),
      },
    })),
    typeof version === "string" ? version : undefined,
  );
  if (status === "error") return { status: "error" };
  refresh();
  return { status };
}
