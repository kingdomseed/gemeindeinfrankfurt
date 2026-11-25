import { describe, expect, it } from "vitest";

import type { Mark } from "./attendance";
import {
  absencesWithinLimit,
  absentAt,
  reportedLocalities,
  reportDue,
  reportNumbers,
  type ReportRegistration,
} from "./report";

const prices = { feeCents: 7000, outlinePriceCents: 500 };
const row = (over: Partial<ReportRegistration> = {}): ReportRegistration => ({
  status: "active",
  seat_type: "full_time",
  waiver: null,
  outline_language: "de",
  second_outline_language: null,
  fee_paid: false,
  outline_paid: false,
  ...over,
});

describe("reportNumbers", () => {
  it("counts seats, fees and outlines of active registrations", () => {
    const n = reportNumbers(
      [
        row({ fee_paid: true, outline_paid: true, second_outline_language: "en" }),
        row({ seat_type: "shared", fee_paid: true }),
        row({ waiver: "hardship" }),
        row({ seat_type: "anaheim", outline_language: null }),
        row({ status: "cancelled", fee_paid: true }),
      ],
      prices,
    );
    expect(n).toEqual({
      seats: 4,
      feesCollected: 2,
      waived: 1,
      collectedCents: 14_000,
      outlineCents: 1000,
      outlines: 2,
      live: 1,
      ukraine: 0,
    });
  });
});

const person = (
  marks: [string, Mark][],
  seat: "full_time" | "part_time" = "full_time",
  chosen: string[] = [],
) => ({
  seat,
  chosen: new Set(chosen),
  marks: new Map(marks),
});

describe("absentAt and absencesWithinLimit", () => {
  it("counts absent and excused people who had to come", () => {
    const people = [
      person([["s1", "absent"]]),
      person([["s1", "excused"]]),
      person([["s1", "present"]]),
      person([["s1", "absent"]], "part_time", ["s2"]),
    ];
    expect(absentAt(people, "s1")).toBe(2);
  });
  it("is within the limit with up to two excused and no unexcused absences", () => {
    expect(
      absencesWithinLimit([
        person([
          ["s1", "excused"],
          ["s2", "excused"],
        ]),
      ]),
    ).toBe(true);
    expect(absencesWithinLimit([person([["s1", "absent"]])])).toBe(false);
  });
});

describe("reportDue", () => {
  it("is seven days after the last message", () => {
    expect(reportDue(new Date("2027-01-24T20:00:00Z")).toISOString()).toBe(
      "2027-01-31T20:00:00.000Z",
    );
  });
});

describe("reportedLocalities", () => {
  it("lists neighboring active localities and custom cities, excluding home and cancelled rows", () => {
    const names = reportedLocalities(
      [
        {
          status: "active",
          other_locality: "",
          localities: { name: "Frankfurt am Main", is_home: true },
        },
        {
          status: "cancelled",
          other_locality: "",
          localities: { name: "Theley", is_home: false },
        },
        {
          status: "active",
          other_locality: "",
          localities: { name: "Saarbrücken", is_home: false },
        },
        { status: "active", other_locality: "  Mainz ", localities: null },
        { status: "active", other_locality: "mainz", localities: null },
        { status: "active", other_locality: "frankfurt am main", localities: null },
        { status: "active", other_locality: "", localities: null },
      ],
      "Frankfurt am Main",
    );
    expect(names).toEqual(["Mainz", "Saarbrücken"]);
  });
});
