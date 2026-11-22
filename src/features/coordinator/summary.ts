import type { CoordinatorDashboard } from "@/lib/coordinator";
import { paymentCounts, possibleDuplicates, seatCounts } from "@/lib/domain/coordination";
import { feesForRegistration, outlineStock, paymentTotals } from "@/lib/domain/payments";

import type { RegistrationRow } from "./types";

// What the coordinator pages show about a training's registrations. Cancelled
// registrations stay in `rows` but count for nothing.
export function summarize({ training, registrations, ordered }: CoordinatorDashboard) {
  const prices = { feeCents: training.fee_cents, outlinePriceCents: training.outline_price_cents };
  const duplicates = possibleDuplicates(registrations.filter((r) => r.status === "active"));
  const rows: RegistrationRow[] = registrations.map((registration) => ({
    registration,
    fees: feesForRegistration(registration, prices),
    duplicate: duplicates.has(registration.id),
  }));
  const active = rows.filter((r) => r.registration.status === "active");
  const paid = active.map((r) => ({ ...r.registration, fees: r.fees }));
  return {
    rows,
    active,
    seats: seatCounts(active.map((r) => r.registration)),
    people: active.reduce((n, r) => n + (r.registration.seat_type === "shared" ? 2 : 1), 0),
    totals: paymentTotals(paid),
    counts: paymentCounts(paid),
    stock: outlineStock(
      active.map((r) => r.registration),
      ordered,
    ),
    duplicates,
  };
}

export type Summary = ReturnType<typeof summarize>;
