import type { Language, SeatType } from "./types";

export type FeeInput = {
  seatType: SeatType;
  attendedAnaheim: boolean;
  ukraineNotEmployed: boolean;
  hardshipWaiver?: boolean;
  outlineLanguage: Language;
  secondOutlineLanguage: Language | null;
};

export type FeePrices = { feeCents: number; outlinePriceCents: number };

export type FeeBreakdown = {
  trainingCents: number;
  outlineCents: number;
  outlineCount: number;
  waived: boolean;
};

// Lebensstrom: one fee per seat (a shared seat pays once); €0 for Anaheim
// attendees and Ukrainian saints who are not gainfully employed. Outlines are
// billed separately and are never waived.
export function computeFees(input: FeeInput, prices: FeePrices): FeeBreakdown {
  const waived = input.attendedAnaheim || input.ukraineNotEmployed || Boolean(input.hardshipWaiver);
  const outlineCount = input.secondOutlineLanguage ? 2 : 1;
  return {
    trainingCents: waived ? 0 : prices.feeCents,
    outlineCents: outlineCount * prices.outlinePriceCents,
    outlineCount,
    waived,
  };
}

export function formatEuro(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(cents / 100);
}
