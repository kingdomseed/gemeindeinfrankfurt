import "server-only";
import { z } from "zod";

import { localizedText } from "@/lib/data";
import type { createClient } from "@/lib/supabase/server";

type CoordinatorClient = Awaited<ReturnType<typeof createClient>>;

const REGISTRATION_COLUMNS =
  "id, status, seat_type, first_name, last_name, partner_first_name, partner_last_name, email, group_language, outline_language, second_outline_language, waiver, fee_paid, outline_paid, registration_sessions(session_id)";

async function newestTraining(supabase: CoordinatorClient) {
  const { data, error } = await supabase
    .from("trainings")
    .select("id, title, fee_cents, outline_price_cents, sessions(id)")
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
