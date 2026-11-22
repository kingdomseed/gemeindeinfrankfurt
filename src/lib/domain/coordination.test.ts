import { describe, expect, it } from "vitest";

import { fromBerlinWallTime, parseEuroCents, toBerlinWallTime } from "./berlin-time";
import {
  daysUntil,
  paymentCounts,
  possibleDuplicates,
  seatCounts,
  trainingDeadlines,
} from "./coordination";
import { feesForRegistration, type PaymentRow } from "./payments";

const session = (n: number, startsAt: string) => ({
  id: `s${n}`,
  message_number: n,
  starts_at: startsAt,
  ends_at: startsAt,
});

describe("trainingDeadlines", () => {
  const sessions = [
    session(12, "2027-01-24T14:00:00Z"),
    session(1, "2027-01-12T18:00:00Z"),
    session(2, "2027-01-15T18:00:00Z"),
  ];

  it("locks at the first message, closes at the end of its day, and wants the report 7 days after the last", () => {
    const d = trainingDeadlines(sessions, "2026-12-01T15:00:00Z");
    expect(d?.outlineOrderDue?.toISOString()).toBe("2026-12-01T15:00:00.000Z");
    expect(d?.sessionsLock.toISOString()).toBe("2027-01-12T18:00:00.000Z");
    expect(d?.registrationCloses.toISOString()).toBe("2027-01-12T22:59:59.999Z");
    expect(d?.reportDue.toISOString()).toBe("2027-01-31T22:59:59.999Z");
  });

  it("has no outline deadline until one is set, and nothing without sessions", () => {
    expect(trainingDeadlines(sessions, null)?.outlineOrderDue).toBeNull();
    expect(trainingDeadlines([], null)).toBeNull();
  });
});

describe("daysUntil", () => {
  it("rounds part days up", () => {
    const now = new Date("2026-11-22T19:00:00Z");
    expect(daysUntil(new Date("2026-12-01T15:00:00Z"), now)).toBe(9);
    expect(daysUntil(new Date("2026-11-22T18:00:00Z"), now)).toBe(0);
  });
});

describe("seatCounts", () => {
  it("counts each seat type", () => {
    expect(
      seatCounts([{ seat_type: "full_time" }, { seat_type: "shared" }, { seat_type: "full_time" }]),
    ).toEqual({ full_time: 2, part_time: 0, shared: 1, anaheim: 0 });
  });
});

describe("paymentCounts", () => {
  const prices = { feeCents: 7000, outlinePriceCents: 500 };
  const row: PaymentRow = {
    seat_type: "full_time",
    waiver: null,
    outline_language: "de",
    second_outline_language: null,
    fee_paid: false,
    outline_paid: false,
  };
  const withFees = (r: PaymentRow) => ({ ...r, fees: feesForRegistration(r, prices) });

  it("counts who has paid, who is waived and who owes nothing", () => {
    const counts = paymentCounts([
      withFees({ ...row, fee_paid: true, outline_paid: true, second_outline_language: "en" }),
      withFees(row),
      withFees({ ...row, waiver: "hardship", outline_paid: true }),
      withFees({ ...row, seat_type: "anaheim", outline_language: null }),
    ]);
    expect(counts).toEqual({
      feeOwed: 2,
      feePaid: 1,
      waived: 1,
      owesNothing: 1,
      outlinesOwed: 4,
      outlinesPaid: 3,
      unpaidRegistrations: 1,
    });
  });
});

describe("possibleDuplicates", () => {
  it("pairs registrations with the same name and email, ignoring case and spaces", () => {
    const ids = possibleDuplicates([
      { id: "a", first_name: "Anna", last_name: "Beispiel", email: "anna@example.com" },
      { id: "b", first_name: "anna ", last_name: "Beispiel", email: "Anna@example.com" },
      { id: "c", first_name: "Anna", last_name: "Beispiel", email: "other@example.com" },
    ]);
    expect([...ids].toSorted()).toEqual(["a", "b"]);
  });
});

describe("Berlin wall time", () => {
  it("reads winter and summer instants as Frankfurt time", () => {
    expect(toBerlinWallTime(new Date("2027-01-12T18:00:00Z"))).toEqual({
      date: "2027-01-12",
      time: "19:00",
    });
    expect(toBerlinWallTime(new Date("2027-07-01T07:30:00Z"))).toEqual({
      date: "2027-07-01",
      time: "09:30",
    });
  });

  it("turns Frankfurt date and time back into the instant, either side of a clock change", () => {
    expect(fromBerlinWallTime({ date: "2027-01-12", time: "19:00" })?.toISOString()).toBe(
      "2027-01-12T18:00:00.000Z",
    );
    expect(fromBerlinWallTime({ date: "2027-03-28", time: "09:45" })?.toISOString()).toBe(
      "2027-03-28T07:45:00.000Z",
    );
  });

  it("rejects malformed and impossible times", () => {
    expect(fromBerlinWallTime({ date: "2027-13-01", time: "10:00" })).toBeNull();
    expect(fromBerlinWallTime({ date: "2027-01-12", time: "7pm" })).toBeNull();
    expect(fromBerlinWallTime({ date: "2027-03-28", time: "02:30" })).toBeNull();
  });
});

describe("parseEuroCents", () => {
  it("accepts German and English decimal marks and a euro sign", () => {
    expect(parseEuroCents("70")).toBe(7000);
    expect(parseEuroCents("70,00")).toBe(7000);
    expect(parseEuroCents("€ 5.5")).toBe(550);
  });

  it("rejects anything else", () => {
    expect(parseEuroCents("")).toBeNull();
    expect(parseEuroCents("-5")).toBeNull();
    expect(parseEuroCents("1.000,00")).toBeNull();
  });
});
