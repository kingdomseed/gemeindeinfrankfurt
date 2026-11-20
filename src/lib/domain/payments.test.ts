import { describe, expect, it } from "vitest";

import {
  feesForRegistration,
  inListFilter,
  openCents,
  outlineStock,
  paymentTotals,
  settledMark,
  type ListRow,
  type PaymentRow,
} from "./payments";

const prices = { feeCents: 7000, outlinePriceCents: 500 };
const row: PaymentRow = {
  seat_type: "full_time",
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

  it("applies an Anaheim waiver on a shared seat to the fee only", () => {
    const fees = feesForRegistration({ ...row, seat_type: "shared", waiver: "anaheim" }, prices);
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

describe("inListFilter", () => {
  const active: ListRow = { ...row, status: "active" };
  const fees = feesForRegistration(active, prices);

  it("lists an active registration with money open as unpaid", () => {
    expect(openCents({ ...active, fee_paid: true }, fees)).toBe(500);
    expect(inListFilter(active, fees, "unpaid")).toBe(true);
    expect(inListFilter({ ...active, fee_paid: true, outline_paid: true }, fees, "unpaid")).toBe(
      false,
    );
  });

  it("keeps a live-training seat out of unpaid", () => {
    const live: ListRow = { ...active, seat_type: "anaheim", outline_language: null };
    const liveFees = feesForRegistration(live, prices);
    expect(inListFilter(live, liveFees, "live")).toBe(true);
    expect(inListFilter(live, liveFees, "unpaid")).toBe(false);
  });

  it("shows a cancelled registration only under all and cancelled", () => {
    const cancelled: ListRow = { ...active, waiver: "hardship", status: "cancelled" };
    expect(openCents(cancelled, fees)).toBe(0);
    expect(inListFilter(cancelled, fees, "all")).toBe(true);
    expect(inListFilter(cancelled, fees, "cancelled")).toBe(true);
    expect(inListFilter(cancelled, fees, "unpaid")).toBe(false);
    expect(inListFilter(cancelled, fees, "waived")).toBe(false);
  });
});

describe("settledMark", () => {
  it("dates a received payment today when no date was given", () => {
    expect(settledMark({ paid: true, paidOn: null, transaction: "TX1" }, "2026-11-20")).toEqual({
      paid: true,
      paidOn: "2026-11-20",
      transaction: "TX1",
    });
  });

  it("keeps the date the coordinator entered", () => {
    const mark = { paid: true, paidOn: "2026-11-03", transaction: "" };
    expect(settledMark(mark, "2026-11-20")).toEqual(mark);
  });

  it("clears the date and transaction number of an unmarked payment", () => {
    expect(
      settledMark({ paid: false, paidOn: "2026-11-03", transaction: "TX1" }, "2026-11-20"),
    ).toEqual({ paid: false, paidOn: null, transaction: "" });
  });
});
