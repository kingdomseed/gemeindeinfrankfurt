import { describe, expect, it } from "vitest";

import { attendanceSyncReducer, initialAttendanceSync } from "./attendance-sync";

describe("attendanceSyncReducer", () => {
  it("keeps marks changed while a flush is in flight", () => {
    let s = attendanceSyncReducer(initialAttendanceSync, {
      type: "toggle",
      id: "r1",
      next: "present",
      stored: {},
    });
    const sent = { ...s.pending };
    s = attendanceSyncReducer(s, { type: "flush_start" });
    expect(s.phase).toBe("syncing");

    // Coordinator taps r1 again before the first request returns.
    s = attendanceSyncReducer(s, {
      type: "toggle",
      id: "r1",
      next: "absent",
      stored: {},
    });
    s = attendanceSyncReducer(s, { type: "flush_succeeded", sent, stored: {} });
    expect(s.phase).toBe("idle");
    expect(s.pending).toEqual({ r1: "absent" });
  });

  it("drops sent marks cleanly and enters offline phase on failure", () => {
    let s = attendanceSyncReducer(initialAttendanceSync, {
      type: "toggle",
      id: "r1",
      next: "excused",
      stored: {},
    });
    s = attendanceSyncReducer(s, { type: "flush_failed" });
    expect(s.phase).toBe("offline");
    expect(s.pending).toEqual({ r1: "excused" });

    s = attendanceSyncReducer(s, { type: "flush_succeeded", sent: { r1: "excused" }, stored: {} });
    expect(s.phase).toBe("idle");
    expect(s.pending).toEqual({});
  });
});
