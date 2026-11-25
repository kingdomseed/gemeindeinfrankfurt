import { describe, expect, it } from "vitest";

import {
  addCalendarDays,
  berlinDayKey,
  berlinMonthKey,
  calendarDayNoon,
  endOfBerlinDate,
  endOfBerlinDay,
  startOfBerlinDate,
  startOfBerlinDay,
} from "./berlin-time";

describe("berlin-time calendar helpers", () => {
  it("formats Frankfurt calendar days and months across midnight UTC", () => {
    const winterMidnight = new Date("2027-01-12T23:30:00Z"); // 00:30 on Jan 13 in Berlin
    expect(berlinDayKey(winterMidnight)).toBe("2027-01-13");
    expect(berlinMonthKey(winterMidnight)).toBe("2027-01");
  });

  it("moves calendar dates across month, leap-year, and year boundaries", () => {
    expect(addCalendarDays("2027-01-28", 7)).toBe("2027-02-04");
    expect(addCalendarDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addCalendarDays("2027-12-30", 3)).toBe("2028-01-02");
    expect(calendarDayNoon("2027-01-09").toISOString()).toBe("2027-01-09T12:00:00.000Z");
    expect(() => addCalendarDays("2027-02-29", 1)).toThrow(RangeError);
    expect(() => addCalendarDays("bad-date", 1)).toThrow(RangeError);
  });

  it("computes start and end of day in Berlin across CET, CEST, spring-forward, and fall-back", () => {
    // Winter (CET, UTC+1)
    expect(startOfBerlinDate("2027-01-12").toISOString()).toBe("2027-01-11T23:00:00.000Z");
    expect(endOfBerlinDate("2027-01-12").toISOString()).toBe("2027-01-12T22:59:59.999Z");

    // Summer (CEST, UTC+2)
    expect(startOfBerlinDay(new Date("2027-07-06T10:00:00Z")).toISOString()).toBe(
      "2027-07-05T22:00:00.000Z",
    );
    expect(endOfBerlinDay(new Date("2027-07-06T10:00:00Z")).toISOString()).toBe(
      "2027-07-06T21:59:59.999Z",
    );

    // Spring forward (2027-03-28: CET -> CEST, 23h day)
    expect(startOfBerlinDate("2027-03-28").toISOString()).toBe("2027-03-27T23:00:00.000Z");
    expect(endOfBerlinDate("2027-03-28").toISOString()).toBe("2027-03-28T21:59:59.999Z");

    // Fall back (2027-10-31: CEST -> CET, 25h day)
    expect(startOfBerlinDate("2027-10-31").toISOString()).toBe("2027-10-30T22:00:00.000Z");
    expect(endOfBerlinDate("2027-10-31").toISOString()).toBe("2027-10-31T22:59:59.999Z");
  });
});
