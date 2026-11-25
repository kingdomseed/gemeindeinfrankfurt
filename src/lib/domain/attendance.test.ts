import { describe, expect, it } from "vitest";

import {
  absenceCounts,
  currentSession,
  isRequired,
  markFromKey,
  nextMark,
  overLimit,
  type Mark,
} from "./attendance";

describe("isRequired", () => {
  const chosen = new Set(["s2"]);
  it("needs full-time and shared seats at every message", () => {
    expect(isRequired("full_time", chosen, "s1")).toBe(true);
    expect(isRequired("shared", chosen, "s1")).toBe(true);
  });
  it("needs part-timers and Anaheim attendees only at the messages they chose", () => {
    expect(isRequired("part_time", chosen, "s1")).toBe(false);
    expect(isRequired("part_time", chosen, "s2")).toBe(true);
    expect(isRequired("anaheim", chosen, "s1")).toBe(false);
  });
});

describe("absenceCounts", () => {
  const marks = new Map<string, Mark>([
    ["s1", "absent"],
    ["s2", "excused"],
    ["s3", "present"],
    ["s4", "excused"],
  ]);
  it("counts unexcused and excused absences apart", () => {
    expect(absenceCounts("full_time", new Set(), marks)).toEqual({ unexcused: 1, excused: 2 });
  });
  it("counts only messages the seat had to come to", () => {
    expect(absenceCounts("part_time", new Set(["s2", "s3"]), marks)).toEqual({
      unexcused: 0,
      excused: 1,
    });
  });
});

describe("overLimit", () => {
  it("flags any unexcused absence, or more than two excused", () => {
    expect(overLimit({ unexcused: 0, excused: 2 })).toBe(false);
    expect(overLimit({ unexcused: 1, excused: 0 })).toBe(true);
    expect(overLimit({ unexcused: 0, excused: 3 })).toBe(true);
  });
});

describe("nextMark", () => {
  it("goes from empty to present, absent, excused and back to empty", () => {
    expect(nextMark(null, true)).toBe("present");
    expect(nextMark("present", true)).toBe("absent");
    expect(nextMark("absent", true)).toBe("excused");
    expect(nextMark("excused", true)).toBeNull();
  });
  it("only marks present for a message someone did not have to come to", () => {
    expect(nextMark(null, false)).toBe("present");
    expect(nextMark("present", false)).toBeNull();
  });
});

describe("markFromKey", () => {
  const en = { present: "P", absent: "A", excused: "E" };
  const de = { present: "A", absent: "F", excused: "E" };
  const ru = { present: "П", absent: "О", excused: "У" };

  it("maps localized short keys case-insensitively and clears with Delete or Backspace", () => {
    expect(markFromKey("p", true, en)).toEqual({ matched: true, mark: "present" });
    expect(markFromKey("A", true, en)).toEqual({ matched: true, mark: "absent" });
    expect(markFromKey("e", true, en)).toEqual({ matched: true, mark: "excused" });
    expect(markFromKey("a", true, de)).toEqual({ matched: true, mark: "present" });
    expect(markFromKey("F", true, de)).toEqual({ matched: true, mark: "absent" });
    expect(markFromKey("п", true, ru)).toEqual({ matched: true, mark: "present" });
    expect(markFromKey("О", true, ru)).toEqual({ matched: true, mark: "absent" });
    expect(markFromKey("у", true, ru)).toEqual({ matched: true, mark: "excused" });
    expect(markFromKey("Backspace", true, en)).toEqual({ matched: true, mark: null });
    expect(markFromKey("Delete", false, en)).toEqual({ matched: true, mark: null });
  });

  it("ignores absent and excused keys on optional sessions and unrelated keys", () => {
    expect(markFromKey("p", false, en)).toEqual({ matched: true, mark: "present" });
    expect(markFromKey("a", false, en)).toEqual({ matched: false });
    expect(markFromKey("e", false, en)).toEqual({ matched: false });
    expect(markFromKey("x", true, en)).toEqual({ matched: false });
    expect(markFromKey("Enter", true, en)).toEqual({ matched: false });
  });
});

describe("currentSession", () => {
  const sessions = [
    { id: "b", starts_at: "2027-01-15T18:00:00Z", ends_at: "2027-01-15T20:00:00Z" },
    { id: "a", starts_at: "2027-01-12T18:00:00Z", ends_at: "2027-01-12T20:00:00Z" },
  ];
  it("picks the first message that has not ended", () => {
    expect(currentSession(sessions, new Date("2027-01-01T00:00:00Z"))?.id).toBe("a");
    expect(currentSession(sessions, new Date("2027-01-12T19:00:00Z"))?.id).toBe("a");
    expect(currentSession(sessions, new Date("2027-01-13T00:00:00Z"))?.id).toBe("b");
  });
  it("picks the last message once the training is over", () => {
    expect(currentSession(sessions, new Date("2027-02-01T00:00:00Z"))?.id).toBe("b");
    expect(currentSession([], new Date())).toBeNull();
  });
});
