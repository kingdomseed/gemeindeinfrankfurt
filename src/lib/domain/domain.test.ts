import { describe, expect, it } from "vitest";

import { canCancel, canRegister, computeCutoffs, endOfBerlinDay } from "./cutoffs";
import { computeFees } from "./fees";
import { openStreetMapUrl } from "./maps";
import { countOutlines } from "./outlines";
import { berlinDay, berlinDayTime, scheduleDays, sessionLabel } from "./sessions";
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

describe("sessionLabel", () => {
  it("shows Berlin time in the page's language", () => {
    const session = { id: "s1", message_number: 1, starts_at: "2026-12-26T08:00:00Z", ends_at: "" };
    expect(sessionLabel(session, "en", "Message 1")).toBe("Message 1: Sat, Dec 26, 09:00 AM");
  });
});

const sessionAt = (id: string, n: number, startsAt: string) => ({
  id,
  message_number: n,
  starts_at: startsAt,
  ends_at: "",
});

describe("scheduleDays", () => {
  it("groups messages by the Frankfurt calendar day, in time order", () => {
    const days = scheduleDays(
      [
        sessionAt("b", 2, "2027-01-09T10:15:00Z"),
        sessionAt("a", 1, "2027-01-09T08:30:00Z"),
        // 00:30 on 10 January in Frankfurt, although still 9 January in UTC.
        sessionAt("c", 3, "2027-01-09T23:30:00Z"),
      ],
      "en-GB",
    );
    expect(days.map((d) => d.key)).toEqual(["2027-01-09", "2027-01-10"]);
    expect(days[0]?.label).toBe("Saturday 9 January");
    expect(days[0]?.sessions).toEqual([
      { id: "a", number: 1, time: "09:30" },
      { id: "b", number: 2, time: "11:15" },
    ]);
    expect(days[1]?.sessions.map((s) => s.number)).toEqual([3]);
  });

  it("returns no days for an empty schedule", () => {
    expect(scheduleDays([], "en")).toEqual([]);
  });
});

describe("berlinDay and berlinDayTime", () => {
  it("names the day and time in Frankfurt in the reader's language", () => {
    const instant = new Date("2027-01-09T08:30:00Z");
    expect(berlinDay(instant, "de")).toBe("Samstag, 9. Januar");
    expect(berlinDayTime(instant, "en-GB")).toBe("Saturday 9 January at 09:30");
  });
});

describe("openStreetMapUrl", () => {
  it("searches OpenStreetMap for the address", () => {
    const url = new URL(openStreetMapUrl("Ginnheimer Stadtweg 120, 60431 Frankfurt am Main"));
    expect(url.origin + url.pathname).toBe("https://www.openstreetmap.org/search");
    expect(url.searchParams.get("query")).toBe("Ginnheimer Stadtweg 120, 60431 Frankfurt am Main");
  });
});
