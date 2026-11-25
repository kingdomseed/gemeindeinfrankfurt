export type DraftSyncStatus =
  | "clean"
  | "dirty"
  | "remote_merged"
  | "conflict"
  | "saving"
  | "saved"
  | "error";

export type DraftSyncState<T extends Record<string, string>> = {
  base: T;
  server: T;
  draft: T;
  baseVersion: string;
  serverVersion: string;
  conflicts: (keyof T)[];
  mergedFields: (keyof T)[];
  status: DraftSyncStatus;
  errorMessage: string | null;
};

export type DraftSyncAction<T extends Record<string, string>> =
  | { type: "edit"; field: keyof T; value: string }
  | { type: "server_updated"; next: T; version: string }
  | { type: "use_server_field"; field: keyof T }
  | { type: "accept_all_server" }
  | { type: "keep_local" }
  | { type: "save_start" }
  | { type: "save_ok"; saved: T; version: string }
  | { type: "save_stale" }
  | { type: "save_error"; message: string | null };

function keysOf<T extends Record<string, string>>(obj: T): (keyof T)[] {
  return Object.keys(obj);
}

function sameValues<T extends Record<string, string>>(a: T, b: T): boolean {
  return keysOf(a).every((k) => a[k] === b[k]);
}

export function initialDraftSync<T extends Record<string, string>>(
  server: T,
  version: string,
): DraftSyncState<T> {
  return {
    base: { ...server },
    server: { ...server },
    draft: { ...server },
    baseVersion: version,
    serverVersion: version,
    conflicts: [],
    mergedFields: [],
    status: "clean",
    errorMessage: null,
  };
}

export function isDraftDirty<T extends Record<string, string>>(state: DraftSyncState<T>): boolean {
  return !sameValues(state.draft, state.server) || state.conflicts.length > 0;
}

function handleEdit<T extends Record<string, string>>(
  state: DraftSyncState<T>,
  field: keyof T,
  value: string,
): DraftSyncState<T> {
  const draft = { ...state.draft, [field]: value };
  const resolved = value === state.server[field];
  const base = resolved ? { ...state.base, [field]: state.server[field] } : state.base;
  const conflicts = resolved ? state.conflicts.filter((f) => f !== field) : state.conflicts;
  const dirty = !sameValues(draft, state.server);
  let status: DraftSyncStatus = "clean";
  if (conflicts.length > 0) status = "conflict";
  else if (dirty) status = "dirty";
  return { ...state, base, draft, conflicts, mergedFields: [], status, errorMessage: null };
}

function handleServerUpdated<T extends Record<string, string>>(
  state: DraftSyncState<T>,
  next: T,
  version: string,
): DraftSyncState<T> {
  if (version === state.serverVersion && sameValues(next, state.server)) {
    return state;
  }
  const base = { ...state.base };
  const draft = { ...state.draft };
  const conflictSet = new Set(state.conflicts);
  const mergedFields: (keyof T)[] = [];

  for (const k of keysOf(state.server)) {
    const serverChanged = next[k] !== state.server[k];
    const locallyEdited = state.draft[k] !== state.base[k];
    if (!locallyEdited) {
      draft[k] = next[k];
      base[k] = next[k];
      conflictSet.delete(k);
      if (serverChanged) mergedFields.push(k);
      continue;
    }
    if (state.draft[k] === next[k]) {
      base[k] = next[k];
      conflictSet.delete(k);
    } else if (serverChanged) {
      conflictSet.add(k);
    }
  }

  const conflicts = keysOf(state.server).filter((k) => conflictSet.has(k));
  const dirtyAfter = !sameValues(draft, next);
  const baseVersion = conflicts.length === 0 ? version : state.baseVersion;
  let status: DraftSyncStatus =
    state.status === "saved" && !dirtyAfter && mergedFields.length === 0 ? "saved" : "clean";
  if (conflicts.length > 0) status = "conflict";
  else if (mergedFields.length > 0 && dirtyAfter) status = "remote_merged";
  else if (dirtyAfter) status = "dirty";

  return {
    ...state,
    base,
    server: { ...next },
    draft,
    baseVersion,
    serverVersion: version,
    conflicts,
    mergedFields,
    status,
    errorMessage: null,
  };
}

// 3-way collaborative draft state machine: auto-merges remote edits to
// untouched fields, protects local edits on same-field collisions, and exposes
// explicit conflict resolution without locks.
export function draftSyncReducer<T extends Record<string, string>>(
  state: DraftSyncState<T>,
  action: DraftSyncAction<T>,
): DraftSyncState<T> {
  switch (action.type) {
    case "edit":
      return handleEdit(state, action.field, action.value);
    case "server_updated":
      return handleServerUpdated(state, action.next, action.version);
    case "use_server_field": {
      const { field } = action;
      const draft = { ...state.draft, [field]: state.server[field] };
      const base = { ...state.base, [field]: state.server[field] };
      const conflicts = state.conflicts.filter((f) => f !== field);
      const baseVersion = conflicts.length === 0 ? state.serverVersion : state.baseVersion;
      const dirty = !sameValues(draft, state.server);
      let status: DraftSyncStatus = "clean";
      if (conflicts.length > 0) status = "conflict";
      else if (dirty) status = "dirty";
      return { ...state, base, draft, conflicts, baseVersion, status, errorMessage: null };
    }
    case "accept_all_server":
      return {
        ...state,
        base: { ...state.server },
        draft: { ...state.server },
        baseVersion: state.serverVersion,
        conflicts: [],
        mergedFields: [],
        status: "clean",
        errorMessage: null,
      };
    case "keep_local": {
      const dirty = !sameValues(state.draft, state.server);
      return {
        ...state,
        base: { ...state.server },
        baseVersion: state.serverVersion,
        conflicts: [],
        mergedFields: [],
        status: dirty ? "dirty" : "clean",
        errorMessage: null,
      };
    }
    case "save_start":
      return { ...state, status: "saving", errorMessage: null };
    case "save_ok":
      return {
        base: { ...action.saved },
        server: { ...action.saved },
        draft: { ...action.saved },
        baseVersion: action.version,
        serverVersion: action.version,
        conflicts: [],
        mergedFields: [],
        status: "saved",
        errorMessage: null,
      };
    case "save_stale":
      return { ...state, status: "conflict", mergedFields: [], errorMessage: null };
    case "save_error":
      return { ...state, status: "error", errorMessage: action.message };
    default:
      return action satisfies never;
  }
}
