import { computeFees, type FeeBreakdown, type FeePrices } from "./fees";
import { countOutlines } from "./outlines";
import { languages, type Language, type SeatType } from "./types";

export type PaymentRow = {
  seat_type: SeatType;
  attended_anaheim: boolean;
  ukraine_not_employed: boolean;
  waiver: string | null;
  outline_language: Language;
  second_outline_language: Language | null;
  fee_paid: boolean;
  outline_paid: boolean;
};

// What one stored registration owes, including a hardship waiver that only
// coordinators can set.
export function feesForRegistration(row: PaymentRow, prices: FeePrices): FeeBreakdown {
  return computeFees(
    {
      seatType: row.seat_type,
      attendedAnaheim: row.attended_anaheim,
      ukraineNotEmployed: row.ukraine_not_employed,
      hardshipWaiver: row.waiver === "hardship",
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

export type OutlineStock = { language: Language; needed: number; ordered: number; extra: number };

// Outlines needed per language against what has been ordered. A negative
// `extra` is a shortfall.
export function outlineStock(
  rows: readonly PaymentRow[],
  ordered: Partial<Record<Language, number>>,
): OutlineStock[] {
  const needed = countOutlines([...rows]);
  return languages.map((language) => {
    const have = ordered[language] ?? 0;
    return { language, needed: needed[language], ordered: have, extra: have - needed[language] };
  });
}
