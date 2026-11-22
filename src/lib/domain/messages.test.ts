import { describe, expect, it } from "vitest";

import { hymnNumber, messageReadiness, occurrenceKeys } from "./messages";

const hymn = { en: "501", de: "214", ru: null };
const verse = (ru: string | undefined) => ({
  ref: "John 1:14",
  text: { de: "Text", en: "Text", ...(ru === undefined ? {} : { ru }) },
});

describe("messageReadiness", () => {
  it("is empty without hymns and verses", () => {
    expect(messageReadiness([], [])).toEqual({ status: "empty" });
  });
  it("is ready when every verse has all three languages", () => {
    expect(messageReadiness([hymn], [verse("Текст")])).toEqual({ status: "ready" });
  });
  it("counts each missing verse text, and missing hymns as one", () => {
    expect(messageReadiness([hymn], [verse(undefined), verse(" ")])).toEqual({
      status: "missing",
      count: 2,
    });
    expect(messageReadiness([], [verse("Текст")])).toEqual({ status: "missing", count: 1 });
  });
});

describe("hymnNumber", () => {
  it("gives the number in a language, or null where the hymn does not exist", () => {
    expect(hymnNumber(hymn, "en")).toBe("501");
    expect(hymnNumber(hymn, "de")).toBe("214");
    expect(hymnNumber(hymn, "ru")).toBeNull();
  });
});

describe("occurrenceKeys", () => {
  it("numbers repeated values", () => {
    expect(occurrenceKeys(["501", "214", "501"])).toEqual(["501", "214", "501#2"]);
  });
});
