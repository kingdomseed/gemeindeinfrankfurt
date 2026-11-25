import "server-only";
import { cache } from "react";
import { z } from "zod";

import { getCoordinatorClient, type CoordinatorClient } from "@/lib/auth";
import { localizedText } from "@/lib/data";
import { registrationEventKinds, type RegistrationEventKind } from "@/lib/domain/types";

const REGISTRATION_COLUMNS =
  "id, created_at, status, seat_type, first_name, last_name, partner_first_name, partner_last_name, email, other_locality, group_language, outline_language, second_outline_language, waiver, fee_paid, outline_paid, site_id, localities(name), training_sites(name), registration_sessions(session_id)";

async function newestTraining(supabase: CoordinatorClient) {
  const { data, error } = await supabase
    .from("trainings")
    .select(
      "id, title, fee_cents, outline_price_cents, outline_order_deadline, sessions(id, message_number, starts_at, ends_at)",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? { ...data, title: localizedText.parse(data.title) } : null;
}

// Everything the coordinator pages show for the newest training, read as the
// signed-in coordinator (row-level security applies). Null when there is no
// training yet. Cancelled registrations are included; the screens set them apart.
export async function loadCoordinatorDashboard(supabase: CoordinatorClient) {
  const training = await newestTraining(supabase);
  if (!training) return null;

  const [registrations, orders] = await Promise.all([
    supabase
      .from("registrations")
      .select(REGISTRATION_COLUMNS)
      .eq("training_id", training.id)
      .order("last_name")
      .order("first_name"),
    supabase.from("outline_orders").select("language, quantity").eq("training_id", training.id),
  ]);
  if (registrations.error) throw registrations.error;
  if (orders.error) throw orders.error;

  return {
    training,
    registrations: registrations.data,
    ordered: Object.fromEntries(orders.data.map((o) => [o.language, o.quantity])),
  };
}

export type CoordinatorDashboard = NonNullable<
  Awaited<ReturnType<typeof loadCoordinatorDashboard>>
>;
export type CoordinatorRegistration = CoordinatorDashboard["registrations"][number];

// The signed-in coordinator's view of the newest training, once per request,
// with the moment it was read so every countdown on the page agrees.
// "signed-out" when nobody (or no coordinator) is signed in.
export const loadCoordination = cache(async () => {
  const supabase = await getCoordinatorClient();
  if (!supabase) return "signed-out" as const;
  return { supabase, data: await loadCoordinatorDashboard(supabase), now: new Date() };
});

export const eventKinds = registrationEventKinds;
export type EventKind = RegistrationEventKind;

const eventRow = z.object({
  id: z.string(),
  kind: z.enum(registrationEventKinds),
  actor_name: z.string(),
  created_at: z.string(),
});
export type RegistrationEvent = z.infer<typeof eventRow>;

// One registration with its chosen sessions and its history, newest first.
export async function loadRegistrationDetail(supabase: CoordinatorClient, id: string) {
  const [registration, events] = await Promise.all([
    supabase
      .from("registrations")
      .select("*, registration_sessions(session_id)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("registration_events")
      .select("id, kind, actor_name, created_at")
      .eq("registration_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (registration.error) throw registration.error;
  if (events.error) throw events.error;
  if (!registration.data) return null;
  return { registration: registration.data, events: z.array(eventRow).parse(events.data) };
}

export type RegistrationDetail = NonNullable<Awaited<ReturnType<typeof loadRegistrationDetail>>>;

export type RecentEvent = RegistrationEvent & {
  registration: { id: string; first_name: string; last_name: string };
};

// The latest history lines across a training's registrations, newest first.
export async function loadRecentEvents(
  supabase: CoordinatorClient,
  trainingId: string,
  limit = 8,
): Promise<RecentEvent[]> {
  const { data, error } = await supabase
    .from("registration_events")
    .select("id, kind, actor_name, created_at, registrations!inner(id, first_name, last_name)")
    .eq("registrations.training_id", trainingId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const recent = eventRow.extend({
    registrations: z.object({ id: z.string(), first_name: z.string(), last_name: z.string() }),
  });
  return z
    .array(recent)
    .parse(data)
    .map((e) => ({
      id: e.id,
      kind: e.kind,
      actor_name: e.actor_name,
      created_at: e.created_at,
      registration: e.registrations,
    }));
}

// Everything the setup page edits for one training.
export async function loadTrainingSetup(supabase: CoordinatorClient, trainingId: string) {
  const { data, error } = await supabase
    .from("trainings")
    .select(
      "id, updated_at, title, fee_cents, outline_price_cents, payee_name, payee_iban, payment_reference, venue, outline_order_deadline, sessions(id, message_number, starts_at, ends_at, is_tested, is_online, registration_sessions(count)), localities(id, name, is_home, registrations(count)), training_sites(id, name, sort_order, registrations(count))",
    )
    .eq("id", trainingId)
    .order("message_number", { referencedTable: "sessions" })
    .order("name", { referencedTable: "localities" })
    .order("sort_order", { referencedTable: "training_sites" })
    .order("name", { referencedTable: "training_sites" })
    .single();
  if (error) throw error;
  const count = z.array(z.object({ count: z.number() })).transform((c) => c[0]?.count ?? 0);
  return {
    ...data,
    title: localizedText.parse(data.title),
    sessions: data.sessions.map((s) => ({
      id: s.id,
      message_number: s.message_number,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      is_tested: s.is_tested,
      is_online: s.is_online,
      picked: count.parse(s.registration_sessions),
    })),
    localities: data.localities.map((l) => ({
      id: l.id,
      name: l.name,
      is_home: l.is_home,
      used: count.parse(l.registrations),
    })),
    sites: data.training_sites.map((s) => ({
      id: s.id,
      name: s.name,
      used: count.parse(s.registrations),
    })),
  };
}

export type TrainingSetup = Awaited<ReturnType<typeof loadTrainingSetup>>;
