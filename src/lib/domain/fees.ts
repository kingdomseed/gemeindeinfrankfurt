import type { Language, SeatType } from "./types";

export type FeeInput = {
  seatType: SeatType;
  hardshipWaiver?: boolean;
  outlineLanguage: Language | null;
  secondOutlineLanguage: Language | null;
};

export type FeePrices = { feeCents: number; outlinePriceCents: number };

export type FeeBreakdown = {
  trainingCents: number;
  outlineCents: number;
  outlineCount: number;
  waived: boolean;
};

// Lebensstrom: one donation per seat (a shared seat gives once). Those who
// attended the live training in Anaheim give nothing and already have their
// outlines. Coordinators can also grant a hardship waiver, which covers the
// fee but not the outlines.
export function computeFees(input: FeeInput, prices: FeePrices): FeeBreakdown {
  const anaheim = input.seatType === "anaheim";
  const waived = anaheim || Boolean(input.hardshipWaiver);
  let outlineCount = 0;
  if (!anaheim && input.outlineLanguage) outlineCount = input.secondOutlineLanguage ? 2 : 1;
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
