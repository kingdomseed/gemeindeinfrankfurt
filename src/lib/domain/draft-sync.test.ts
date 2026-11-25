import { describe, expect, it } from "vitest";

import { draftSyncReducer, initialDraftSync, isDraftDirty } from "./draft-sync";

type Sample = { notes: string; firstDay: string; lastDay: string };
const s0: Sample = { notes: "", firstDay: "2027-01-12", lastDay: "2027-01-24" };

describe("draftSyncReducer", () => {
  it("adopts all remote changes when the local form is clean", () => {
    const start = initialDraftSync(s0, "v1");
    const next = draftSyncReducer(start, {
      type: "server_updated",
      next: { ...s0, notes: "Hello" },
      version: "v2",
    });
    expect(next.draft.notes).toBe("Hello");
    expect(next.baseVersion).toBe("v2");
    expect(next.status).toBe("clean");
    expect(isDraftDirty(next)).toBe(false);
  });

  it("3-way merges non-overlapping remote edits while keeping local unsaved text", () => {
    let state = initialDraftSync(s0, "v1");
    state = draftSyncReducer(state, { type: "edit", field: "notes", value: "Local note" });
    state = draftSyncReducer(state, {
      type: "server_updated",
      next: { ...s0, firstDay: "2027-01-13" },
      version: "v2",
    });
    expect(state.draft.notes).toBe("Local note");
    expect(state.draft.firstDay).toBe("2027-01-13");
    expect(state.baseVersion).toBe("v2");
    expect(state.mergedFields).toEqual(["firstDay"]);
    expect(state.conflicts).toEqual([]);
    expect(state.status).toBe("remote_merged");
  });

  it("preserves local edit and flags a conflict on same-field collision", () => {
    let state = initialDraftSync(s0, "v1");
    state = draftSyncReducer(state, { type: "edit", field: "notes", value: "Jason draft" });
    state = draftSyncReducer(state, {
      type: "server_updated",
      next: { ...s0, notes: "Max draft" },
      version: "v2",
    });
    expect(state.draft.notes).toBe("Jason draft");
    expect(state.server.notes).toBe("Max draft");
    expect(state.baseVersion).toBe("v1");
    expect(state.serverVersion).toBe("v2");
    expect(state.conflicts).toEqual(["notes"]);
    expect(state.status).toBe("conflict");
  });

  it("clears conflict silently if the remote value matches what was typed locally", () => {
    let state = initialDraftSync(s0, "v1");
    state = draftSyncReducer(state, { type: "edit", field: "notes", value: "Same text" });
    state = draftSyncReducer(state, {
      type: "server_updated",
      next: { ...s0, notes: "Same text" },
      version: "v2",
    });
    expect(state.conflicts).toEqual([]);
    expect(state.status).toBe("clean");
  });

  it("resolves conflicts via use_server_field, accept_all_server, or keep_local", () => {
    let conflict = initialDraftSync(s0, "v1");
    conflict = draftSyncReducer(conflict, { type: "edit", field: "notes", value: "Mine" });
    conflict = draftSyncReducer(conflict, {
      type: "edit",
      field: "lastDay",
      value: "2027-01-25",
    });
    conflict = draftSyncReducer(conflict, {
      type: "server_updated",
      next: { notes: "Theirs", firstDay: "2027-01-12", lastDay: "2027-01-26" },
      version: "v2",
    });
    expect(conflict.conflicts).toEqual(["notes", "lastDay"]);

    const partial = draftSyncReducer(conflict, { type: "use_server_field", field: "lastDay" });
    expect(partial.draft.lastDay).toBe("2027-01-26");
    expect(partial.conflicts).toEqual(["notes"]);
    expect(partial.status).toBe("conflict");

    const accepted = draftSyncReducer(conflict, { type: "accept_all_server" });
    expect(accepted.draft).toEqual({
      notes: "Theirs",
      firstDay: "2027-01-12",
      lastDay: "2027-01-26",
    });
    expect(accepted.baseVersion).toBe("v2");
    expect(accepted.status).toBe("clean");

    const kept = draftSyncReducer(conflict, { type: "keep_local" });
    expect(kept.draft.notes).toBe("Mine");
    expect(kept.baseVersion).toBe("v2");
    expect(kept.conflicts).toEqual([]);
    expect(kept.status).toBe("dirty");
  });

  it("preserves draft on save_stale and save_error, and resets base on save_ok", () => {
    let state = initialDraftSync(s0, "v1");
    state = draftSyncReducer(state, { type: "edit", field: "notes", value: "Unsaved" });
    state = draftSyncReducer(state, { type: "save_start" });
    expect(state.status).toBe("saving");

    const stale = draftSyncReducer(state, { type: "save_stale" });
    expect(stale.draft.notes).toBe("Unsaved");
    expect(stale.status).toBe("conflict");

    const err = draftSyncReducer(state, { type: "save_error", message: "Bad input" });
    expect(err.draft.notes).toBe("Unsaved");
    expect(err.status).toBe("error");
    expect(err.errorMessage).toBe("Bad input");

    const saved = { ...s0, notes: "Unsaved" };
    const ok = draftSyncReducer(state, { type: "save_ok", saved, version: "v2" });
    expect(ok.status).toBe("saved");
    expect(ok.baseVersion).toBe("v2");
    expect(isDraftDirty(ok)).toBe(false);
  });

  it("preserves edits typed while a save is pending", () => {
    let state = initialDraftSync(s0, "v1");
    state = draftSyncReducer(state, { type: "edit", field: "notes", value: "Saving..." });
    const snapshot = { ...state.draft };
    state = draftSyncReducer(state, { type: "save_start" });
    state = draftSyncReducer(state, { type: "edit", field: "notes", value: "Saving... plus more" });
    state = draftSyncReducer(state, { type: "edit", field: "firstDay", value: "2027-01-11" });

    const ok = draftSyncReducer(state, { type: "save_ok", saved: snapshot, version: "v2" });
    expect(ok.base).toEqual(snapshot);
    expect(ok.server).toEqual(snapshot);
    expect(ok.draft.notes).toBe("Saving... plus more");
    expect(ok.draft.firstDay).toBe("2027-01-11");
    expect(ok.status).toBe("dirty");
    expect(ok.baseVersion).toBe("v2");
    expect(isDraftDirty(ok)).toBe(true);
  });

  it("keeps newer serverVersion and clears conflicts when save_ok omits version", () => {
    let state = initialDraftSync(s0, "v1");
    state = draftSyncReducer(state, { type: "edit", field: "notes", value: "Saving" });
    const snapshot = { ...state.draft };
    state = draftSyncReducer(state, { type: "save_start" });
    state = draftSyncReducer(state, {
      type: "server_updated",
      next: { ...s0, firstDay: "2027-01-10", notes: "Remote" },
      version: "v2",
    });
    state = draftSyncReducer(state, { type: "edit", field: "lastDay", value: "2027-01-25" });

    const ok = draftSyncReducer(state, { type: "save_ok", saved: snapshot });
    expect(ok.baseVersion).toBe("v2");
    expect(ok.serverVersion).toBe("v2");
    expect(ok.conflicts).toEqual([]);
    expect(ok.draft.notes).toBe("Saving");
    expect(ok.draft.lastDay).toBe("2027-01-25");
    expect(ok.status).toBe("dirty");
  });
});
