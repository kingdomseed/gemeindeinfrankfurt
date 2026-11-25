import "server-only";
import type { QueryData } from "@supabase/supabase-js";
import { z } from "zod";

import { sortLocalities } from "@/lib/domain/locality";
import type { Language, LocalityOption, SiteOption, TrainingSession } from "@/lib/domain/types";
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
  venue: string;
  rules: { [L in Language]?: string | undefined };
};

export type TrainingWithSessions = Training & {
  sessions: TrainingSession[];
  localities: LocalityOption[];
  sites: SiteOption[];
};

const TRAINING_COLUMNS =
  "id, slug, title, fee_cents, outline_price_cents, payee_name, payee_iban, payment_reference, venue, rules, sessions(id, message_number, starts_at, ends_at, is_online), localities(id, name, is_home), training_sites(id, name, sort_order)";

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
  const { training_sites, localities, sessions, ...rest } = row;
  return {
    ...rest,
    title: localizedText.parse(row.title),
    rules: localizedRules.parse(row.rules),
    sessions: sessions.toSorted((a, b) => a.message_number - b.message_number),
    localities: sortLocalities(localities),
    sites: training_sites
      .toSorted((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "de"))
      .map(({ id, name }) => ({ id, name })),
  };
}
