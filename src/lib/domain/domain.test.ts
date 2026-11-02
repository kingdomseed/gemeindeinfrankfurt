import { describe, expect, it } from "vitest";

import { canCancel, canRegister, computeCutoffs, endOfBerlinDay } from "./cutoffs";
import { computeFees } from "./fees";
import { countOutlines } from "./outlines";
import { hashToken, newEditToken } from "./token";

const prices = { feeCents: 7000, outlinePriceCents: 500 };
const base = {
  seatType: "full_time" as const,
  attendedAnaheim: false,
  ukraineNotEmployed: false,
  outlineLanguage: "de" as const,
  secondOutlineLanguage: null,
};

describe("computeFees", () => {
  it("charges one fee per seat plus one outline", () => {
    expect(computeFees(base, prices)).toEqual({
      trainingCents: 7000,
      outlineCents: 500,
      outlineCount: 1,
      waived: false,
    });
  });

  it("charges a shared seat once", () => {
    expect(computeFees({ ...base, seatType: "shared" }, prices).trainingCents).toBe(7000);
  });

  it("waives the fee but not the outlines", () => {
    const fees = computeFees(
      { ...base, ukraineNotEmployed: true, secondOutlineLanguage: "ru" },
      prices,
    );
    expect(fees.trainingCents).toBe(0);
    expect(fees.outlineCents).toBe(1000);
  });
});

describe("cutoffs", () => {
  // First message on a January evening in Frankfurt (CET, UTC+1).
  const sessions = [
    {
      id: "2",
      message_number: 2,
      starts_at: "2027-01-08T18:00:00Z",
      ends_at: "2027-01-08T20:30:00Z",
    },
    {
      id: "1",
      message_number: 1,
      starts_at: "2027-01-05T18:00:00Z",
      ends_at: "2027-01-05T20:30:00Z",
    },
  ];

  it("locks changes at the first session", () => {
    expect(computeCutoffs(sessions)?.seatAndSessionsLockAt.toISOString()).toBe(
      "2027-01-05T18:00:00.000Z",
    );
    expect(canCancel(sessions, new Date("2027-01-05T17:59:00Z"))).toBe(true);
    expect(canCancel(sessions, new Date("2027-01-05T18:00:00Z"))).toBe(false);
  });

  it("closes registration at the end of the first day in Berlin", () => {
    expect(canRegister(sessions, new Date("2027-01-05T22:30:00Z"))).toBe(true);
    expect(canRegister(sessions, new Date("2027-01-05T23:00:00Z"))).toBe(false);
  });

  it("handles summer time", () => {
    expect(endOfBerlinDay(new Date("2027-07-06T10:00:00Z")).toISOString()).toBe(
      "2027-07-06T21:59:59.999Z",
    );
  });
});

describe("countOutlines", () => {
  it("counts second outlines", () => {
    expect(
      countOutlines([
        { outline_language: "de", second_outline_language: "en" },
        { outline_language: "ru", second_outline_language: null },
        { outline_language: "de", second_outline_language: null },
      ]),
    ).toEqual({ de: 2, en: 1, ru: 1 });
  });
});

describe("edit token", () => {
  it("stores only a hash", () => {
    const { token, hash } = newEditToken();
    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(hash).toBe(hashToken(token));
    expect(hash).not.toContain(token);
  });
});
