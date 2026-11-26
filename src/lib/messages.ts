import "server-only";
import { createHash } from "node:crypto";

import { z } from "zod";

import type { CoordinatorClient } from "@/lib/auth";
import { localizedText } from "@/lib/data";
import { hymnsFingerprint, versesFingerprint } from "@/lib/domain/list-sync";
import type { Hymn, Verse } from "@/lib/domain/messages";
import type { Language } from "@/lib/domain/types";
import { createAdminClient } from "@/lib/supabase/admin";
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
  endsAt: string;
  hymns: Hymn[];
  verses: Verse[];
};

const screenTokenSchema = z.string().regex(/^[0-9a-f]{32,128}$/);

export type SharedTrainingScreen = {
  trainingId: string;
  title: Record<Language, string>;
  sessions: MessageContent[];
};

export function screenContentVersion(hymns: readonly Hymn[], verses: readonly Verse[]): string {
  const payload = JSON.stringify([hymnsFingerprint(hymns), versesFingerprint(verses)]);
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

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
      "id, message_number, starts_at, ends_at, message_hymns(position, number_en, number_de, number_ru), message_verses(body)",
    )
    .eq("training_id", trainingId)
    .order("message_number")
    .order("position", { referencedTable: "message_hymns" });
  if (error) throw error;
  return data.map((s) => ({
    sessionId: s.id,
    messageNumber: s.message_number,
    startsAt: s.starts_at,
    endsAt: s.ends_at,
    hymns: s.message_hymns.map((h) => ({ en: h.number_en, de: h.number_de, ru: h.number_ru })),
    verses: parseStoredVerses(s.message_verses?.body),
  }));
}

// Loads a training's screen-only content via its unguessable share token.
// Returns null if the token does not match; never exposes personal data.
export async function loadSharedTrainingByToken(
  rawToken: string,
): Promise<SharedTrainingScreen | null> {
  const parsedToken = screenTokenSchema.safeParse(rawToken);
  if (!parsedToken.success) return null;

  const { data, error } = await createAdminClient()
    .from("trainings")
    .select(
      "id, title, sessions(id, message_number, starts_at, ends_at, message_hymns(position, number_en, number_de, number_ru), message_verses(body))",
    )
    .eq("screen_token", parsedToken.data)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const sessions: MessageContent[] = data.sessions
    .toSorted((a, b) => a.message_number - b.message_number)
    .map((s) => ({
      sessionId: s.id,
      messageNumber: s.message_number,
      startsAt: s.starts_at,
      endsAt: s.ends_at,
      hymns: s.message_hymns
        .toSorted((a, b) => a.position - b.position)
        .map((h) => ({ en: h.number_en, de: h.number_de, ru: h.number_ru })),
      verses: parseStoredVerses(s.message_verses?.body),
    }));

  return {
    trainingId: data.id,
    title: localizedText.parse(data.title),
    sessions,
  };
}

// Lightweight check used by open share links to refresh when hymns or verses change.
export async function loadSharedMessageVersion(
  rawToken: string,
  messageNumber: number,
): Promise<string | null> {
  const parsedToken = screenTokenSchema.safeParse(rawToken);
  if (!parsedToken.success) return null;

  const { data, error } = await createAdminClient()
    .from("sessions")
    .select(
      "id, message_hymns(position, number_en, number_de, number_ru), message_verses(body), trainings!inner(id)",
    )
    .eq("trainings.screen_token", parsedToken.data)
    .eq("message_number", messageNumber)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const hymns = data.message_hymns
    .toSorted((a, b) => a.position - b.position)
    .map((h) => ({ en: h.number_en, de: h.number_de, ru: h.number_ru }));
  const verses = parseStoredVerses(data.message_verses?.body);
  return screenContentVersion(hymns, verses);
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
