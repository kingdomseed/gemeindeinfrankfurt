import type { Hymn, Verse } from "./messages";
import type { Language } from "./types";

export type ListSyncStatus =
  | "clean"
  | "dirty"
  | "remote_updated"
  | "conflict"
  | "saving"
  | "saved"
  | "error";

export type ListSyncState<T> = {
  items: T[];
  serverItems: T[];
  baseVersion: string;
  serverVersion: string;
  status: ListSyncStatus;
  errorMessage: string | null;
};

export type ListSyncAction<T> =
  | { type: "edit"; items: T[] }
  | { type: "server_updated"; items: T[]; version: string }
  | { type: "accept_server" }
  | { type: "keep_local" }
  | { type: "save_start" }
  | { type: "save_ok"; items: T[]; version: string }
  | { type: "save_stale" }
  | { type: "save_error"; message: string | null };

export function hymnsFingerprint(hymns: readonly Hymn[]): string {
  return JSON.stringify(
    hymns.map((h) => ({ en: h.en.trim(), de: h.de?.trim() || null, ru: h.ru?.trim() || null })),
  );
}

export function versesFingerprint(verses: readonly Verse[]): string {
  return JSON.stringify(
    verses.map((v) => ({
      ref: v.ref.trim(),
      de: v.text.de?.trim() || "",
      en: v.text.en?.trim() || "",
      ru: v.text.ru?.trim() || "",
    })),
  );
}

export function scheduleFingerprint(
  sessions: readonly {
    id: string;
    starts_at: string;
    ends_at: string;
    is_tested: boolean;
    is_online: boolean;
  }[],
): string {
  return JSON.stringify(
    sessions.map((s) => [
      s.id,
      Date.parse(s.starts_at),
      Date.parse(s.ends_at),
      s.is_tested,
      s.is_online,
    ]),
  );
}

export function outlineOrdersFingerprint(orders: Readonly<Record<Language, number>>): string {
  return `${orders.de}:${orders.en}:${orders.ru}`;
}

export function initialListSync<T>(items: readonly T[], version: string): ListSyncState<T> {
  return {
    items: [...items],
    serverItems: [...items],
    baseVersion: version,
    serverVersion: version,
    status: "clean",
    errorMessage: null,
  };
}

// Collaborative state machine for ordered list editors (hymns, verses): live-updates
// when clean, warns without losing edits when dirty, and checks optimistic concurrency.
export function listSyncReducer<T>(
  state: ListSyncState<T>,
  action: ListSyncAction<T>,
): ListSyncState<T> {
  switch (action.type) {
    case "edit": {
      const dirty = JSON.stringify(action.items) !== JSON.stringify(state.serverItems);
      return {
        ...state,
        items: action.items,
        status: dirty ? "dirty" : "clean",
        errorMessage: null,
      };
    }
    case "server_updated": {
      if (action.version === state.serverVersion) return state;
      const dirty =
        state.status === "dirty" || state.status === "conflict" || state.status === "error";
      if (!dirty) {
        const unchangedSaved =
          state.status === "saved" &&
          JSON.stringify(action.items) === JSON.stringify(state.serverItems);
        return {
          items: [...action.items],
          serverItems: [...action.items],
          baseVersion: action.version,
          serverVersion: action.version,
          status: unchangedSaved ? "saved" : "remote_updated",
          errorMessage: null,
        };
      }
      return {
        ...state,
        serverItems: [...action.items],
        serverVersion: action.version,
        status: "conflict",
        errorMessage: null,
      };
    }
    case "accept_server":
      return {
        items: [...state.serverItems],
        serverItems: [...state.serverItems],
        baseVersion: state.serverVersion,
        serverVersion: state.serverVersion,
        status: "clean",
        errorMessage: null,
      };
    case "keep_local":
      return {
        ...state,
        baseVersion: state.serverVersion,
        status: "dirty",
        errorMessage: null,
      };
    case "save_start":
      return { ...state, status: "saving", errorMessage: null };
    case "save_ok":
      return {
        items: [...action.items],
        serverItems: [...action.items],
        baseVersion: action.version,
        serverVersion: action.version,
        status: "saved",
        errorMessage: null,
      };
    case "save_stale":
      return { ...state, status: "conflict", errorMessage: null };
    case "save_error":
      return { ...state, status: "error", errorMessage: action.message };
    default:
      return action satisfies never;
  }
}
