import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Language, Session } from "@/lib/domain/types";

export type Training = {
  id: string;
  slug: string;
  title: Record<Language, string>;
  fee_cents: number;
  outline_price_cents: number;
  payee_name: string;
  payee_iban: string;
  payment_reference: string;
  rules: Partial<Record<Language, string>>;
};

export type TrainingWithSessions = Training & { sessions: Session[] };

const TRAINING_COLUMNS =
  "id, slug, title, fee_cents, outline_price_cents, payee_name, payee_iban, payment_reference, rules, sessions(id, message_number, starts_at, ends_at)";

// The training currently open for registration: the published one whose
// schedule starts last. Coordinators publish one training at a time.
export async function getPublishedTraining(): Promise<TrainingWithSessions | null> {
  const { data, error } = await createAdminClient()
    .from("trainings")
    .select(TRAINING_COLUMNS)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? sortSessions(data as TrainingWithSessions) : null;
}

export async function getTrainingById(id: string): Promise<TrainingWithSessions> {
  const { data, error } = await createAdminClient()
    .from("trainings")
    .select(TRAINING_COLUMNS)
    .eq("id", id)
    .single();
  if (error) throw error;
  return sortSessions(data as TrainingWithSessions);
}

function sortSessions(t: TrainingWithSessions): TrainingWithSessions {
  return { ...t, sessions: [...t.sessions].sort((a, b) => a.message_number - b.message_number) };
}
