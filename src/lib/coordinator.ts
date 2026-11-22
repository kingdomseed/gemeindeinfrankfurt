import "server-only";
import { cache } from "react";
import { z } from "zod";

import { getCoordinatorClient } from "@/lib/auth";
import { localizedText } from "@/lib/data";
import type { createClient } from "@/lib/supabase/server";

type CoordinatorClient = Awaited<ReturnType<typeof createClient>>;

const REGISTRATION_COLUMNS =
  "id, created_at, status, seat_type, first_name, last_name, partner_first_name, partner_last_name, email, group_language, outline_language, second_outline_language, waiver, fee_paid, outline_paid, localities(name), registration_sessions(session_id)";

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

export const eventKinds = [
  "fee_received",
  "fee_unmarked",
  "outline_received",
  "outline_unmarked",
  "waiver_set",
  "waiver_removed",
  "payment_edited",
  "edited",
  "cancelled",
  "link_sent",
] as const;
export type EventKind = (typeof eventKinds)[number];

const eventRow = z.object({
  id: z.string(),
  kind: z.enum(eventKinds),
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

// Adds lines to a registration's history under the signed-in coordinator's name.
export async function recordEvents(
  supabase: CoordinatorClient,
  registrationId: string,
  kinds: readonly EventKind[],
) {
  if (kinds.length === 0) return;
  const { data: auth } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("coordinators")
    .select("display_name")
    .eq("user_id", auth.user?.id ?? "")
    .maybeSingle();
  const { error } = await supabase.from("registration_events").insert(
    kinds.map((kind) => ({
      registration_id: registrationId,
      kind,
      actor_name: me?.display_name ?? "",
    })),
  );
  if (error) throw error;
}

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
