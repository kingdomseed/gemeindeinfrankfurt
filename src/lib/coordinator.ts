import "server-only";
import { localizedText } from "@/lib/data";
import type { createClient } from "@/lib/supabase/server";

type CoordinatorClient = Awaited<ReturnType<typeof createClient>>;

const REGISTRATION_COLUMNS =
  "id, seat_type, first_name, last_name, partner_first_name, partner_last_name, group_language, outline_language, second_outline_language, attended_anaheim, ukraine_not_employed, waiver, payer_name, fee_paid, outline_paid";

// Everything the coordinator page shows for the newest training, read as the
// signed-in coordinator (row-level security applies). Null when there is no
// training yet.
export async function loadCoordinatorDashboard(supabase: CoordinatorClient) {
  const { data: training, error } = await supabase
    .from("trainings")
    .select("id, title, fee_cents, outline_price_cents")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!training) return null;

  const [registrations, orders] = await Promise.all([
    supabase
      .from("registrations")
      .select(REGISTRATION_COLUMNS)
      .eq("training_id", training.id)
      .eq("status", "active")
      .order("last_name"),
    supabase.from("outline_orders").select("language, quantity").eq("training_id", training.id),
  ]);
  if (registrations.error) throw registrations.error;
  if (orders.error) throw orders.error;

  return {
    training: { ...training, title: localizedText.parse(training.title) },
    registrations: registrations.data,
    ordered: Object.fromEntries(orders.data.map((o) => [o.language, o.quantity])),
  };
}

export type CoordinatorDashboard = NonNullable<
  Awaited<ReturnType<typeof loadCoordinatorDashboard>>
>;
export type CoordinatorRegistration = CoordinatorDashboard["registrations"][number];
