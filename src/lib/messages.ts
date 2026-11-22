import "server-only";
import { z } from "zod";

import type { Hymn, Verse } from "@/lib/domain/messages";
import type { createClient } from "@/lib/supabase/server";

type CoordinatorClient = Awaited<ReturnType<typeof createClient>>;

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

export type MessageContent = {
  sessionId: string;
  messageNumber: number;
  startsAt: string;
  hymns: Hymn[];
  verses: Verse[];
};

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
    verses: verseBody.parse(s.message_verses?.body).verses,
  }));
}

// Replaces a message's hymns with these, in this order, all at once.
export async function saveHymns(
  supabase: CoordinatorClient,
  sessionId: string,
  hymns: readonly Hymn[],
) {
  const { error } = await supabase.rpc("replace_message_hymns", {
    p_session: sessionId,
    p_hymns: hymns.map((h) => ({ en: h.en, de: h.de, ru: h.ru })),
  });
  if (error) throw error;
}

// Replaces a message's verses with these, in reading order.
export async function saveVerses(
  supabase: CoordinatorClient,
  sessionId: string,
  verses: readonly Verse[],
) {
  const { error } = await supabase
    .from("message_verses")
    .upsert({ session_id: sessionId, body: { verses: verses.map((v) => ({ ...v })) } });
  if (error) throw error;
}
