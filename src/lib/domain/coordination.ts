import { endOfBerlinDay, firstSession } from "./cutoffs";
import type { FeeBreakdown } from "./fees";
import type { SeatType, Session } from "./types";

const DAY_MS = 24 * 3600_000;

export type Deadlines = {
  // Set per training; null until a coordinator enters it.
  outlineOrderDue: Date | null;
  sessionsLock: Date;
  registrationCloses: Date;
  // Lebensstrom wants the questionnaire within 7 days of the last message.
  reportDue: Date;
};

// The dates the coordinators work towards, from the schedule. Null without sessions.
export function trainingDeadlines(
  sessions: readonly Session[],
  outlineOrderDeadline: string | null,
): Deadlines | null {
  const first = firstSession([...sessions]);
  const last = sessions.toSorted((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at))[0];
  if (!first || !last) return null;
  const start = new Date(first.starts_at);
  return {
    outlineOrderDue: outlineOrderDeadline === null ? null : new Date(outlineOrderDeadline),
    sessionsLock: start,
    registrationCloses: endOfBerlinDay(start),
    reportDue: endOfBerlinDay(new Date(Date.parse(last.starts_at) + 7 * DAY_MS)),
  };
}

// Whole days from now until a moment, rounded up; negative once it has passed.
export function daysUntil(moment: Date, now: Date): number {
  const days = Math.ceil((moment.getTime() - now.getTime()) / DAY_MS);
  return days === 0 ? 0 : days; // never -0
}

export function seatCounts(rows: readonly { seat_type: SeatType }[]): Record<SeatType, number> {
  const counts: Record<SeatType, number> = { full_time: 0, part_time: 0, shared: 0, anaheim: 0 };
  for (const r of rows) counts[r.seat_type] += 1;
  return counts;
}

type PaidRow = {
  fees: FeeBreakdown;
  fee_paid: boolean;
  outline_paid: boolean;
  waiver: string | null;
};

export type PaymentCounts = {
  // Registrations that owe a donation, and how many of them have paid it.
  feeOwed: number;
  feePaid: number;
  waived: number;
  // Seats that owe nothing at all, such as live-training attendees.
  owesNothing: number;
  // Outlines on registrations that owe for them, and how many of those are paid.
  outlinesOwed: number;
  outlinesPaid: number;
  // Registrations with any money still open.
  unpaidRegistrations: number;
};

// The counts under the money totals. Pass active registrations only.
export function paymentCounts(rows: readonly PaidRow[]): PaymentCounts {
  const c: PaymentCounts = {
    feeOwed: 0,
    feePaid: 0,
    waived: 0,
    owesNothing: 0,
    outlinesOwed: 0,
    outlinesPaid: 0,
    unpaidRegistrations: 0,
  };
  for (const r of rows) {
    if (r.waiver !== null) c.waived += 1;
    if (r.fees.trainingCents > 0) {
      c.feeOwed += 1;
      if (r.fee_paid) c.feePaid += 1;
    }
    if (r.fees.trainingCents === 0 && r.fees.outlineCents === 0 && r.waiver === null) {
      c.owesNothing += 1;
    }
    c.outlinesOwed += r.fees.outlineCount;
    if (r.outline_paid) c.outlinesPaid += r.fees.outlineCount;
    const open =
      (r.fee_paid ? 0 : r.fees.trainingCents) + (r.outline_paid ? 0 : r.fees.outlineCents);
    if (open > 0) c.unpaidRegistrations += 1;
  }
  return c;
}

type Identity = { id: string; first_name: string; last_name: string; email: string };

// Ids of active registrations that share a name and email with another one,
// which usually means someone sent the form twice.
export function possibleDuplicates(rows: readonly Identity[]): Set<string> {
  const byKey = new Map<string, string[]>();
  for (const r of rows) {
    const key = [r.first_name, r.last_name, r.email].map((s) => s.trim().toLowerCase()).join("|");
    byKey.set(key, [...(byKey.get(key) ?? []), r.id]);
  }
  return new Set([...byKey.values()].filter((ids) => ids.length > 1).flat());
}
