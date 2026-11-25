"use client";

import {
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
  useTransition,
  type SyntheticEvent,
} from "react";

import type { DraftSyncStatus } from "@/lib/domain/draft-sync";
import { initialListSync, listSyncReducer } from "@/lib/domain/list-sync";

import { useCoordinatorLive } from "./LiveWorkspace";
import type { FormAction } from "./types";
import { toFormResult } from "./useCollaborativeForm";

export type KeyedRow<T> = T & { key: number };

const noConflicts: readonly string[] = [];

function keyedRows<T extends object>(list: readonly T[]): KeyedRow<T>[] {
  return list.map((item, i) => ({ ...item, key: i }));
}

function toBannerStatus(s: string): DraftSyncStatus {
  if (s === "remote_updated") return "remote_merged";
  if (s === "conflict") return "conflict";
  return "clean";
}

// Manages collaborative list editing (hymns, verses) with live server sync,
// optimistic concurrency checks, and Presence "editing" status.
export function useCollaborativeList<T extends object>(opts: {
  initial: readonly T[];
  fingerprint: (items: readonly T[]) => string;
  createEmpty: () => T;
  action: FormAction;
}) {
  const formId = useId();
  const { setEditing } = useCoordinatorLive();
  const nextKey = useRef(10_000);
  const serverVersion = opts.fingerprint(opts.initial);
  const [state, dispatch] = useReducer(listSyncReducer<KeyedRow<T>>, undefined, () =>
    initialListSync(keyedRows(opts.initial), serverVersion),
  );
  const [seenVersion, setSeenVersion] = useState(serverVersion);
  const [pending, startTransition] = useTransition();

  if (seenVersion !== serverVersion) {
    setSeenVersion(serverVersion);
    dispatch({
      type: "server_updated",
      items: keyedRows(opts.initial),
      version: serverVersion,
    });
  }

  const dirty = state.status === "dirty" || state.status === "conflict" || state.status === "error";
  useEffect(() => {
    setEditing(formId, dirty);
    return () => setEditing(formId, false);
  }, [formId, dirty, setEditing]);

  function add() {
    const key = nextKey.current;
    nextKey.current += 1;
    dispatch({ type: "edit", items: [...state.items, { ...opts.createEmpty(), key }] });
  }

  function update(key: number, updater: (row: KeyedRow<T>) => KeyedRow<T>) {
    dispatch({
      type: "edit",
      items: state.items.map((row) => (row.key === key ? updater(row) : row)),
    });
  }

  function remove(key: number) {
    dispatch({ type: "edit", items: state.items.filter((row) => row.key !== key) });
  }

  function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("version", state.baseVersion);
    const snapshot = [...state.items];
    const nextFp = opts.fingerprint(snapshot);
    dispatch({ type: "save_start" });
    startTransition(async () => {
      const res = await opts.action({ status: "idle" }, form);
      if (res.status === "saved") {
        dispatch({ type: "save_ok", items: snapshot, version: nextFp });
      } else if (res.status === "stale") {
        dispatch({ type: "save_stale" });
      } else {
        dispatch({ type: "save_error", message: res.message ?? null });
      }
    });
  }

  return {
    items: state.items,
    pending,
    add,
    update,
    remove,
    submit,
    result: toFormResult(state.status, state.errorMessage),
    bannerProps: {
      status: toBannerStatus(state.status),
      conflicts: noConflicts,
      onAcceptAllServer: () => dispatch({ type: "accept_server" }),
      onKeepLocal: () => dispatch({ type: "keep_local" }),
    },
  };
}
