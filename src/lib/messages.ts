import "server-only";
import { z } from "zod";

import type { CoordinatorClient } from "@/lib/auth";
import type { Hymn, Verse } from "@/lib/domain/messages";
import type { Json } from "@/lib/supabase/database.types";

// message_verses.body: the verses in reading order, each with its text per language.
const verseBody = z
  .object({
    verses: z
      .array(
        z.object({
          ref: z.string(),
          text: z.object({ de: z.string(), en: z.string(), ru: z.string() }).partial(),
        }),
      )
      .catch([]),
  })
  .catch({ verses: [] });

export function parseStoredVerses(body: unknown): Verse[] {
  return verseBody.parse(body).verses;
}

export type MessageContent = {
  sessionId: string;
  messageNumber: number;
  startsAt: string;
  hymns: Hymn[];
  verses: Verse[];
};

const saveStatus = z.enum(["saved", "stale"]);
const hymnVersionSchema = z.array(
  z.object({ en: z.string(), de: z.string().nullable(), ru: z.string().nullable() }),
);
const verseVersionSchema = z.array(
  z.object({ ref: z.string(), de: z.string(), en: z.string(), ru: z.string() }),
);

function parseExpectedState<T extends Json>(
  version: string | undefined,
  schema: z.ZodType<T>,
): { ok: true; value: T | undefined } | { ok: false } {
  if (version === undefined) return { ok: true, value: undefined };
  try {
    const raw: unknown = JSON.parse(version);
    const parsed = schema.safeParse(raw);
    return parsed.success ? { ok: true, value: parsed.data } : { ok: false };
  } catch {
    return { ok: false };
  }
}

// Every message of a training with its hymns and verses, in order.
export async function loadMessages(
  supabase: CoordinatorClient,
  trainingId: string,
): Promise<MessageContent[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, message_number, starts_at, message_hymns(position, number_en, number_de, number_ru), message_verses(body)",
    )
    .eq("training_id", trainingId)
    .order("message_number")
    .order("position", { referencedTable: "message_hymns" });
  if (error) throw error;
  return data.map((s) => ({
    sessionId: s.id,
    messageNumber: s.message_number,
    startsAt: s.starts_at,
    hymns: s.message_hymns.map((h) => ({ en: h.number_en, de: h.number_de, ru: h.number_ru })),
    verses: parseStoredVerses(s.message_verses?.body),
  }));
}

// Replaces a message's hymns atomically with optional optimistic concurrency check.
export async function saveHymns(
  supabase: CoordinatorClient,
  sessionId: string,
  hymns: readonly Hymn[],
  expectedVersion?: string,
): Promise<"saved" | "stale" | "error"> {
  const parsedVersion = parseExpectedState(expectedVersion, hymnVersionSchema);
  if (!parsedVersion.ok) return "error";
  const { data, error } = await supabase.rpc("save_message_hymns", {
    p_session: sessionId,
    p_hymns: hymns.map((h) => ({ en: h.en, de: h.de, ru: h.ru })),
    ...(parsedVersion.value !== undefined ? { p_expected_state: parsedVersion.value } : {}),
  });
  if (error) throw error;
  return saveStatus.parse(data);
}

// Replaces a message's verses atomically with optional optimistic concurrency check.
export async function saveVerses(
  supabase: CoordinatorClient,
  sessionId: string,
  verses: readonly Verse[],
  expectedVersion?: string,
): Promise<"saved" | "stale" | "error"> {
  const parsedVersion = parseExpectedState(expectedVersion, verseVersionSchema);
  if (!parsedVersion.ok) return "error";
  const { data, error } = await supabase.rpc("save_message_verses", {
    p_session: sessionId,
    p_verses: verses.map((v) => ({ ...v })),
    ...(parsedVersion.value !== undefined ? { p_expected_state: parsedVersion.value } : {}),
  });
  if (error) throw error;
  return saveStatus.parse(data);
}
