import { absenceCounts, isRequired, overLimit, type Mark } from "./attendance";
import type { FeePrices } from "./fees";
import { feesForRegistration, type PaymentRow } from "./payments";
import type { SeatType } from "./types";

export type ReportRegistration = PaymentRow & { status: "active" | "cancelled" };

export type ReportNumbers = {
  seats: number;
  feesCollected: number;
  waived: number;
  collectedCents: number;
  outlineCents: number;
  outlines: number;
  live: number;
  ukraine: number;
};

// The questionnaire's numbers. Cancelled registrations do not count; a
// shared seat is one seat and one fee.
export function reportNumbers(
  rows: readonly ReportRegistration[],
  prices: FeePrices,
): ReportNumbers {
  const numbers: ReportNumbers = {
    seats: 0,
    feesCollected: 0,
    waived: 0,
    collectedCents: 0,
    outlineCents: 0,
    outlines: 0,
    live: 0,
    ukraine: 0,
  };
  for (const row of rows) {
    if (row.status !== "active") continue;
    const fees = feesForRegistration(row, prices);
    numbers.seats += 1;
    if (row.seat_type === "anaheim") numbers.live += 1;
    else if (row.waiver !== null) numbers.waived += 1;
    if (row.waiver === "ukraine_not_employed") numbers.ukraine += 1;
    if (row.fee_paid && fees.trainingCents > 0) {
      numbers.feesCollected += 1;
      numbers.collectedCents += fees.trainingCents;
    }
    if (row.outline_paid) {
      numbers.outlineCents += fees.outlineCents;
      numbers.outlines += fees.outlineCount;
    }
  }
  return numbers;
}

export type AttendancePerson = {
  seat: SeatType;
  chosen: ReadonlySet<string>;
  marks: ReadonlyMap<string, Mark>;
};

// How many people who had to come to a message were absent, excused or not.
export function absentAt(people: readonly AttendancePerson[], sessionId: string): number {
  return people.filter((p) => {
    const mark = p.marks.get(sessionId);
    return (mark === "absent" || mark === "excused") && isRequired(p.seat, p.chosen, sessionId);
  }).length;
}

// Whether everyone kept within the absence limit.
export function absencesWithinLimit(people: readonly AttendancePerson[]): boolean {
  return people.every((p) => !overLimit(absenceCounts(p.seat, p.chosen, p.marks)));
}

// The questionnaire, the fees and the reimbursements are due this many days
// after the last message.
export const REPORT_DAYS = 7;

export function reportDue(lastEnd: Date): Date {
  return new Date(lastEnd.getTime() + REPORT_DAYS * 24 * 60 * 60 * 1000);
}

// An amount typed in euros, "19,90", "19.90" or "320", in cents. Null when
// it is not an amount.
export function parseEuroCents(value: string): number | null {
  const match = /^(\d{1,6})(?:[.,](\d{1,2}))?$/.exec(value.trim().replace(/\s|€/g, ""));
  if (!match) return null;
  const [, euros = "0", cents = ""] = match;
  return Number(euros) * 100 + Number(cents.padEnd(2, "0"));
}
