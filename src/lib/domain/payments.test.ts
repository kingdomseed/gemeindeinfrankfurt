import { describe, expect, it } from "vitest";

import { feesForRegistration, outlineStock, paymentTotals, type PaymentRow } from "./payments";

const prices = { feeCents: 7000, outlinePriceCents: 500 };
const row: PaymentRow = {
  seat_type: "full_time",
  attended_anaheim: false,
  ukraine_not_employed: false,
  waiver: null,
  outline_language: "de",
  second_outline_language: null,
  fee_paid: false,
  outline_paid: false,
};

describe("feesForRegistration", () => {
  it("applies a hardship waiver to the fee only", () => {
    const fees = feesForRegistration({ ...row, waiver: "hardship" }, prices);
    expect(fees).toMatchObject({ trainingCents: 0, outlineCents: 500, waived: true });
  });
});

describe("paymentTotals", () => {
  it("splits received and unpaid money", () => {
    const fees = feesForRegistration({ ...row, second_outline_language: "ru" }, prices);
    const totals = paymentTotals([
      { fees, fee_paid: true, outline_paid: false },
      { fees, fee_paid: false, outline_paid: true },
    ]);
    expect(totals).toEqual({ feesReceived: 7000, outlinesReceived: 1000, unpaid: 8000 });
  });
});

describe("outlineStock", () => {
  it("reports shortfalls as negative extra", () => {
    const stock = outlineStock([row, { ...row, second_outline_language: "en" }], { de: 1, ru: 2 });
    expect(stock).toEqual([
      { language: "de", needed: 2, ordered: 1, extra: -1 },
      { language: "en", needed: 1, ordered: 0, extra: -1 },
      { language: "ru", needed: 0, ordered: 2, extra: 2 },
    ]);
  });
});
