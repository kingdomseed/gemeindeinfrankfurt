import { describe, expect, it } from "vitest";

import { attendanceMarkKey, type Mark } from "./attendance";
import {
  absencesWithinLimit,
  absentAt,
  buildReportView,
  reportedLocalities,
  reportDue,
  reportNumbers,
  type ReportAnswers,
  type ReportRegistration,
  type ReportRegistrationInput,
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
  it("is end of the 7th calendar day after the last day in Europe/Berlin", () => {
    expect(reportDue(new Date("2027-01-24T20:00:00Z")).toISOString()).toBe(
      "2027-01-31T22:59:59.999Z",
    );
    expect(reportDue("2027-03-22").toISOString()).toBe("2027-03-29T21:59:59.999Z");
  });
});

describe("buildReportView", () => {
  const answers: ReportAnswers = {
    tested: null,
    absencesLimited: null,
    nameTags: false,
    seatsAssigned: null,
    inPerson: null,
  };
  const sessions = [
    {
      id: "s2",
      message_number: 2,
      starts_at: "2027-01-15T18:00:00Z",
      ends_at: "2027-01-15T20:00:00Z",
    },
    {
      id: "s1",
      message_number: 1,
      starts_at: "2027-01-12T18:00:00Z",
      ends_at: "2027-01-12T20:00:00Z",
    },
  ];
  const registrations: ReportRegistrationInput[] = [
    {
      ...row({ fee_paid: true, outline_paid: true }),
      id: "r1",
      first_name: "Anna",
      last_name: "Test",
      partner_first_name: null,
      partner_last_name: null,
      registration_sessions: [],
    },
    {
      ...row({ seat_type: "shared" }),
      id: "r2",
      first_name: "Ben",
      last_name: "Pair",
      partner_first_name: "Eva",
      partner_last_name: "Pair",
      registration_sessions: [],
    },
    {
      ...row({ status: "cancelled" }),
      id: "r3",
      first_name: "Gone",
      last_name: "User",
      partner_first_name: null,
      partner_last_name: null,
      registration_sessions: [],
    },
  ];

  it("projects numbers, sorted messages, resolved answers, over-limit names, and due date", () => {
    const view = buildReportView({
      prices,
      sessions,
      registrations,
      marks: {
        [attendanceMarkKey("r2", "s1")]: "absent",
        [attendanceMarkKey("r3", "s1")]: "absent",
      },
      answers,
      testsPlanned: 1,
      lastDay: null,
    });

    expect(view.numbers.seats).toBe(2);
    expect(view.resolved.tested).toEqual({ value: true, suggested: true });
    expect(view.resolved.absencesLimited).toEqual({ value: false, suggested: true });
    expect(view.resolved.nameTags).toEqual({ value: false, suggested: false });
    expect(view.messages).toEqual([
      { number: 1, startsAt: "2027-01-12T18:00:00Z", absent: 1 },
      { number: 2, startsAt: "2027-01-15T18:00:00Z", absent: 0 },
    ]);
    expect(view.overLimit).toEqual([
      { id: "r2", name: "Ben Pair · Eva Pair", unexcused: 1, excused: 0 },
    ]);
    expect(view.firstStart).toBe("2027-01-12T18:00:00Z");
    expect(view.lastEnd).toBe("2027-01-15T20:00:00Z");
    expect(view.due?.toISOString()).toBe("2027-01-22T22:59:59.999Z");

    const overridden = buildReportView({
      prices,
      sessions,
      registrations,
      marks: {},
      answers,
      testsPlanned: 0,
      lastDay: "2027-01-17",
    });
    expect(overridden.due?.toISOString()).toBe("2027-01-24T22:59:59.999Z");
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
