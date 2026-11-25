import type { Mark } from "./attendance";

export type PendingMarks = Record<string, Mark | null>;

export type AttendanceSyncState = {
  pending: PendingMarks;
  phase: "idle" | "syncing" | "offline";
};

export type AttendanceSyncAction =
  | { type: "hydrate"; stored: PendingMarks }
  | { type: "toggle"; id: string; next: Mark | null; stored: PendingMarks }
  | { type: "flush_start" }
  | { type: "flush_succeeded"; sent: PendingMarks; stored: PendingMarks }
  | { type: "flush_failed" };

export const initialAttendanceSync: AttendanceSyncState = {
  pending: {},
  phase: "idle",
};

// Explicit offline-first queue state machine for AttendanceTaker.
export function attendanceSyncReducer(
  state: AttendanceSyncState,
  action: AttendanceSyncAction,
): AttendanceSyncState {
  switch (action.type) {
    case "hydrate": {
      const pending = { ...action.stored, ...state.pending };
      return { ...state, pending };
    }
    case "toggle": {
      const pending = { ...action.stored, ...state.pending, [action.id]: action.next };
      return { ...state, pending };
    }
    case "flush_start":
      return { ...state, phase: "syncing" };
    case "flush_succeeded": {
      const merged = { ...action.stored, ...state.pending };
      const pending = Object.fromEntries(
        Object.entries(merged).filter(
          ([id, mark]) => !(id in action.sent) || action.sent[id] !== mark,
        ),
      );
      return { pending, phase: "idle" };
    }
    case "flush_failed":
      return { ...state, phase: "offline" };
    default:
      return action satisfies never;
  }
}
