import { computeFees, type FeeBreakdown, type FeePrices } from "./fees";
import { countOutlines } from "./outlines";
import {
  languages,
  type AssignableFeeWaiver,
  type FeeWaiver,
  type Language,
  type RegistrationEventKind,
  type SeatType,
} from "./types";

export type PaymentRow = {
  seat_type: SeatType;
  waiver: string | null;
  outline_language: Language | null;
  second_outline_language: Language | null;
  fee_paid: boolean;
  outline_paid: boolean;
};

// What one stored registration owes, including a waiver that only
// coordinators can set (hardship, or Anaheim on a shared seat).
export function feesForRegistration(row: PaymentRow, prices: FeePrices): FeeBreakdown {
  return computeFees(
    {
      seatType: row.seat_type,
      hardshipWaiver: row.waiver !== null,
      outlineLanguage: row.outline_language,
      secondOutlineLanguage: row.second_outline_language,
    },
    prices,
  );
}

export type PaymentTotals = { feesReceived: number; outlinesReceived: number; unpaid: number };

// Money received and still owed across all registrations, in cents.
export function paymentTotals(
  rows: readonly { fees: FeeBreakdown; fee_paid: boolean; outline_paid: boolean }[],
): PaymentTotals {
  const totals = { feesReceived: 0, outlinesReceived: 0, unpaid: 0 };
  for (const { fees, fee_paid, outline_paid } of rows) {
    if (fee_paid) totals.feesReceived += fees.trainingCents;
    else totals.unpaid += fees.trainingCents;
    if (outline_paid) totals.outlinesReceived += fees.outlineCents;
    else totals.unpaid += fees.outlineCents;
  }
  return totals;
}

export type OutlineStock = {
  language: Language;
  // Outlines in this language as a registration's first and as its second outline.
  first: number;
  second: number;
  needed: number;
  ordered: number;
  extra: number;
};

// Outlines needed per language against what has been ordered. A negative
// `extra` is a shortfall.
export function outlineStock(
  rows: readonly PaymentRow[],
  ordered: Partial<Record<Language, number>>,
): OutlineStock[] {
  const first = countOutlines(rows.map((r) => ({ ...r, second_outline_language: null })));
  const second = countOutlines(
    rows.map((r) => ({
      outline_language: r.second_outline_language,
      second_outline_language: null,
    })),
  );
  return languages.map((language) => {
    const have = ordered[language] ?? 0;
    const needed = first[language] + second[language];
    return {
      language,
      first: first[language],
      second: second[language],
      needed,
      ordered: have,
      extra: have - needed,
    };
  });
}

export const listFilters = ["all", "unpaid", "live", "waived", "cancelled"] as const;
export type ListFilter = (typeof listFilters)[number];

export type ListRow = PaymentRow & { status: "active" | "cancelled" };

// What an active registration still owes, in cents. A cancelled one owes nothing.
export function openCents(row: ListRow, fees: FeeBreakdown): number {
  if (row.status === "cancelled") return 0;
  return (row.fee_paid ? 0 : fees.trainingCents) + (row.outline_paid ? 0 : fees.outlineCents);
}

// Whether a registration belongs under one of the coordinator list's filters.
// "all" shows everything; the other filters except "cancelled" hold active
// registrations only.
export function inListFilter(row: ListRow, fees: FeeBreakdown, filter: ListFilter): boolean {
  if (filter === "all") return true;
  if (filter === "cancelled") return row.status === "cancelled";
  if (row.status === "cancelled") return false;
  if (filter === "unpaid") return openCents(row, fees) > 0;
  if (filter === "live") return row.seat_type === "anaheim";
  return row.waiver !== null;
}

export type PaymentMark = { paid: boolean; paidOn: string | null; transaction: string };

// A payment mark as it is stored. A received payment with no date is dated
// today; an unmarked one keeps neither its date nor its transaction number.
export function settledMark(mark: PaymentMark, today: string): PaymentMark {
  if (!mark.paid) return { paid: false, paidOn: null, transaction: "" };
  return { ...mark, paidOn: mark.paidOn ?? today };
}

export type PaymentEventKind = Extract<
  RegistrationEventKind,
  | "fee_received"
  | "fee_unmarked"
  | "outline_received"
  | "outline_unmarked"
  | "waiver_set"
  | "waiver_removed"
  | "payment_edited"
>;

export type PaymentSnapshot = {
  waiver: FeeWaiver | null;
  waiver_reason: string;
  outline_language: Language | null;
  fee_paid: boolean;
  fee_paid_on: string | null;
  fee_transaction: string;
  outline_paid: boolean;
  outline_paid_on: string | null;
  outline_transaction: string;
};

export type PaymentUpdateInput = {
  fee: PaymentMark;
  outline: PaymentMark;
  waiver: AssignableFeeWaiver | null;
  waiverReason: string;
};

export type PaymentUpdatePlan = {
  fee: PaymentMark | null;
  outline: PaymentMark | null;
  waiver: AssignableFeeWaiver | null;
  waiverReason: string;
  events: PaymentEventKind[];
};

// Computes the stored payment columns and audit events for a coordinator payment save.
// A waived donation and a registration without outlines leave those columns untouched.
export function planPaymentUpdate(
  existing: PaymentSnapshot,
  input: PaymentUpdateInput,
  today: string,
): PaymentUpdatePlan {
  const fee = existing.waiver === null ? settledMark(input.fee, today) : null;
  const outline = existing.outline_language === null ? null : settledMark(input.outline, today);
  const waiverReason = input.waiver === null ? "" : input.waiverReason;
  const events: PaymentEventKind[] = [];

  if (fee && fee.paid !== existing.fee_paid) {
    events.push(fee.paid ? "fee_received" : "fee_unmarked");
  }
  if (outline && outline.paid !== existing.outline_paid) {
    events.push(outline.paid ? "outline_received" : "outline_unmarked");
  }
  if ((input.waiver === null) !== (existing.waiver === null)) {
    events.push(input.waiver === null ? "waiver_removed" : "waiver_set");
  }

  const feeCorrected =
    fee !== null &&
    fee.paid === existing.fee_paid &&
    (fee.paidOn !== existing.fee_paid_on || fee.transaction !== existing.fee_transaction);
  const outlineCorrected =
    outline !== null &&
    outline.paid === existing.outline_paid &&
    (outline.paidOn !== existing.outline_paid_on ||
      outline.transaction !== existing.outline_transaction);
  const waiverCorrected =
    input.waiver !== null &&
    existing.waiver !== null &&
    (input.waiver !== existing.waiver || waiverReason !== existing.waiver_reason);
  if (feeCorrected || outlineCorrected || waiverCorrected) {
    events.push("payment_edited");
  }

  return { fee, outline, waiver: input.waiver, waiverReason, events };
}
