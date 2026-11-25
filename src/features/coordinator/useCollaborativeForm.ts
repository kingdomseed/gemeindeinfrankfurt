"use client";

import { useEffect, useId, useReducer, useState, useTransition, type SyntheticEvent } from "react";

import {
  draftSyncReducer,
  initialDraftSync,
  isDraftDirty,
  type DraftSyncStatus,
} from "@/lib/domain/draft-sync";
import type { ListSyncStatus } from "@/lib/domain/list-sync";

import { useCoordinatorLive } from "./LiveWorkspace";
import type { FormAction, FormState } from "./types";

export function toFormResult(
  status: DraftSyncStatus | ListSyncStatus,
  message: string | null,
): FormState {
  if (status === "saved") return { status: "saved" };
  if (status === "error") return { status: "error", ...(message ? { message } : {}) };
  return { status: "idle" };
}

function sameRecord<T extends Record<string, string>>(a: T, b: T): boolean {
  return Object.keys(a).every((k) => a[k] === b[k]);
}

function isFieldOf<T extends Record<string, string>>(
  field: string,
  obj: T,
): field is Extract<keyof T, string> {
  return Object.hasOwn(obj, field);
}

// Manages 3-way collaborative draft sync, optimistic concurrency checks,
// and Presence "editing" reporting for coordinator forms without manual locks.
export function useCollaborativeForm<T extends Record<string, string>>(opts: {
  server: T;
  version: string;
  action: FormAction;
}) {
  const formId = useId();
  const { setEditing } = useCoordinatorLive();
  const [state, dispatch] = useReducer(draftSyncReducer<T>, undefined, () =>
    initialDraftSync(opts.server, opts.version),
  );
  const [seen, setSeen] = useState({ server: opts.server, version: opts.version });
  const [pending, startTransition] = useTransition();

  if (seen.version !== opts.version || !sameRecord(seen.server, opts.server)) {
    setSeen({ server: opts.server, version: opts.version });
    dispatch({ type: "server_updated", next: opts.server, version: opts.version });
  }

  const dirty = isDraftDirty(state);

  useEffect(() => {
    setEditing(formId, dirty);
    return () => setEditing(formId, false);
  }, [formId, dirty, setEditing]);

  function edit(field: keyof T, value: string) {
    dispatch({ type: "edit", field, value });
  }

  function takeServerField(field: string) {
    if (isFieldOf(field, opts.server)) {
      dispatch({ type: "use_server_field", field });
    }
  }

  function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("version", state.baseVersion);
    const snapshot = { ...state.draft };
    dispatch({ type: "save_start" });
    startTransition(async () => {
      const result: FormState = await opts.action({ status: "idle" }, form);
      if (result.status === "saved") {
        dispatch({ type: "save_ok", saved: snapshot });
      } else if (result.status === "stale") {
        dispatch({ type: "save_stale" });
      } else {
        dispatch({ type: "save_error", message: result.message ?? null });
      }
    });
  }

  return {
    draft: state.draft,
    pending,
    dirty,
    edit,
    submit,
    result: toFormResult(state.status, state.errorMessage),
    bannerProps: {
      status: state.status,
      conflicts: state.conflicts,
      serverValues: state.server,
      onUseServerField: takeServerField,
      onAcceptAllServer: () => dispatch({ type: "accept_all_server" }),
      onKeepLocal: () => dispatch({ type: "keep_local" }),
    },
  };
}
