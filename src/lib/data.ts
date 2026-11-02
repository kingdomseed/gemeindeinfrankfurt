import "server-only";
import type { QueryData } from "@supabase/supabase-js";
import { z } from "zod";

import type { Language, Session } from "@/lib/domain/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type Training = {
  id: string;
  slug: string;
  title: Record<Language, string>;
  fee_cents: number;
  outline_price_cents: number;
  payee_name: string;
  payee_iban: string;
  payment_reference: string;
  rules: { [L in Language]?: string | undefined };
};

export type TrainingWithSessions = Training & { sessions: Session[] };

const TRAINING_COLUMNS =
  "id, slug, title, fee_cents, outline_price_cents, payee_name, payee_iban, payment_reference, rules, sessions(id, message_number, starts_at, ends_at)";

const trainingQuery = () => createAdminClient().from("trainings").select(TRAINING_COLUMNS);
type TrainingRow = QueryData<ReturnType<typeof trainingQuery>>[number];

// title and rules are jsonb columns; check their shape instead of trusting it.
export const localizedText = z.object({ de: z.string(), en: z.string(), ru: z.string() });
const localizedRules = localizedText.partial();

// The training currently open for registration: the published one whose
// schedule starts last. Coordinators publish one training at a time.
export async function getPublishedTraining(): Promise<TrainingWithSessions | null> {
  const { data, error } = await trainingQuery()
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toTraining(data) : null;
}

export async function getTrainingById(id: string): Promise<TrainingWithSessions> {
  const { data, error } = await trainingQuery().eq("id", id).single();
  if (error) throw error;
  return toTraining(data);
}

function toTraining(row: TrainingRow): TrainingWithSessions {
  return {
    ...row,
    title: localizedText.parse(row.title),
    rules: localizedRules.parse(row.rules),
    sessions: row.sessions.toSorted((a, b) => a.message_number - b.message_number),
  };
}
