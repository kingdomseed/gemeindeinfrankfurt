import { describe, expect, it } from "vitest";

import {
  initialRegistrationForm,
  registrationFormReducer,
  type RegistrationFormState,
} from "./registration-form";

const fees = { trainingCents: 7000, outlineCents: 500, outlineCount: 1, waived: false };

function baseState(): RegistrationFormState<string> {
  return initialRegistrationForm({
    defaults: undefined,
    locale: "en",
    siteIds: ["site-1"],
  });
}

describe("registrationFormReducer", () => {
  it("auto-selects a single site and falls back to locale for outline", () => {
    const s = baseState();
    expect(s.fields).toEqual({
      seatType: "full_time",
      outline: "en",
      second: "",
      locality: "",
      otherLocality: "",
      siteId: "site-1",
    });
    expect(s.view).toEqual({ phase: "editing", sessionsMissing: false });
  });

  it("clears second outline when primary matches it, and rejects matching second", () => {
    let s = baseState();
    s = registrationFormReducer(s, { type: "set_second", second: "de" });
    expect(s.fields.second).toBe("de");
    s = registrationFormReducer(s, { type: "set_outline", outline: "de" });
    expect(s.fields.second).toBe("");
    s = registrationFormReducer(s, { type: "set_second", second: "de" });
    expect(s.fields.second).toBe("");
  });

  it("clears custom locality text when switching back to a known locality", () => {
    let s = baseState();
    s = registrationFormReducer(s, { type: "set_locality", locality: "other" });
    s = registrationFormReducer(s, { type: "set_other_locality", otherLocality: "Mainz" });
    s = registrationFormReducer(s, { type: "set_locality", locality: "loc-1" });
    expect(s.fields.locality).toBe("loc-1");
    expect(s.fields.otherLocality).toBe("");
  });

  it("clears missing-sessions flag when leaving part_time or picking a session", () => {
    let s = registrationFormReducer(baseState(), { type: "set_seat_type", seatType: "part_time" });
    s = registrationFormReducer(s, { type: "sessions_missing" });
    expect(s.view).toEqual({ phase: "editing", sessionsMissing: true });
    s = registrationFormReducer(s, { type: "set_seat_type", seatType: "full_time" });
    expect(s.view).toEqual({ phase: "editing", sessionsMissing: false });
  });

  it("freezes the receipt snapshot across edits during submit and resets cleanly for another person", () => {
    let s = registrationFormReducer(baseState(), {
      type: "submit_start",
      receipt: { fees, summary: "original" },
    });
    s = registrationFormReducer(s, { type: "set_outline", outline: "ru" });
    s = registrationFormReducer(s, {
      type: "submit_result",
      result: { status: "done", calendarUrl: "/en/training/r/tok/calendar.ics" },
    });
    expect(s.view).toEqual({
      phase: "receipt",
      calendarUrl: "/en/training/r/tok/calendar.ics",
      receipt: { fees, summary: "original" },
    });

    const next = registrationFormReducer(s, { type: "register_another" });
    expect(next.formKey).toBe(1);
    expect(next.actionStatus).toBe("idle");
    expect(next.fields.outline).toBe("ru");
    expect(next.view).toEqual({ phase: "editing", sessionsMissing: false });
  });

  it("returns to editing with error/saved status when not done", () => {
    let s = registrationFormReducer(baseState(), {
      type: "submit_start",
      receipt: { fees, summary: "draft" },
    });
    s = registrationFormReducer(s, { type: "submit_result", result: { status: "duplicate" } });
    expect(s.actionStatus).toBe("duplicate");
    expect(s.view).toEqual({ phase: "editing", sessionsMissing: false });
  });
});
