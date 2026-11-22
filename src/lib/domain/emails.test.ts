import { describe, expect, it } from "vitest";

import {
  beforeTrainingDue,
  countByLocale,
  fallbackLanguages,
  inAudience,
  isAudience,
  textFor,
  type AudienceMember,
} from "./emails";

const member = (over: Partial<AudienceMember> = {}): AudienceMember => ({
  locale: "de",
  seat: "full_time",
  openCents: 0,
  groupId: null,
  ...over,
});

describe("isAudience", () => {
  it("knows the fixed audiences and groups by id", () => {
    expect(isAudience("everyone")).toBe(true);
    expect(isAudience("group:5b0e6b5e-3f1a-4c4e-9a43-1d2f3e4a5b6c")).toBe(true);
    expect(isAudience("group:1")).toBe(false);
    expect(isAudience("all")).toBe(false);
  });
});

describe("inAudience", () => {
  it("picks the unpaid, the part-time seats and one group", () => {
    expect(inAudience(member({ openCents: 700 }), "unpaid")).toBe(true);
    expect(inAudience(member(), "unpaid")).toBe(false);
    expect(inAudience(member({ seat: "part_time" }), "part_time")).toBe(true);
    expect(inAudience(member({ seat: "shared" }), "part_time")).toBe(false);
    expect(inAudience(member({ groupId: "g1" }), "group:g1")).toBe(true);
    expect(inAudience(member({ groupId: "g2" }), "group:g1")).toBe(false);
    expect(inAudience(member(), "everyone")).toBe(true);
  });
});

describe("textFor and fallbackLanguages", () => {
  const en = { subject: "Change", body: "Text" };
  it("falls back to English", () => {
    expect(textFor({ en }, "ru")).toEqual(en);
    expect(textFor({}, "ru")).toBeNull();
  });
  it("names the languages whose readers would get English", () => {
    const counts = countByLocale([member(), member({ locale: "ru" }), member({ locale: "en" })]);
    expect(counts).toEqual({ de: 1, en: 1, ru: 1 });
    expect(fallbackLanguages(counts, new Set(["en", "de"]))).toEqual(["ru"]);
    expect(fallbackLanguages({ de: 0, en: 3, ru: 0 }, new Set(["en"]))).toEqual([]);
  });
});

describe("beforeTrainingDue", () => {
  it("is three days before the first message", () => {
    expect(beforeTrainingDue(new Date("2027-01-12T18:00:00Z")).toISOString()).toBe(
      "2027-01-09T18:00:00.000Z",
    );
  });
});
