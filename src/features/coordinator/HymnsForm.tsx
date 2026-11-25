"use client";

import { Button, chakra, Grid, HStack, Input, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
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
import { hymnsFingerprint, initialListSync, listSyncReducer } from "@/lib/domain/list-sync";
import type { Hymn } from "@/lib/domain/messages";

import { ConflictBanner } from "./ConflictBanner";
import { FormResult } from "./FormResult";
import { useCoordinatorLive } from "./LiveWorkspace";
import type { FormAction, FormState } from "./types";

type Row = Hymn & { key: number };

function toBannerStatus(s: string): DraftSyncStatus {
  if (s === "remote_updated") return "remote_merged";
  if (s === "conflict") return "conflict";
  return "clean";
}

function toFormResult(status: string, message: string | null): FormState {
  if (status === "saved") return { status: "saved" };
  if (status === "error") return { status: "error", ...(message ? { message } : {}) };
  return { status: "idle" };
}

function keyedRows(list: readonly Hymn[]): Row[] {
  return list.map((h, i) => ({ ...h, key: i }));
}

// Hymn numbers for one message, quick to type when they arrive late. A box
// left empty means the hymn does not exist in that language.
export function HymnsForm(props: {
  // What is saved now; the form keeps its own copy while it is open.
  initialHymns: readonly Hymn[];
  action: FormAction;
}) {
  const t = useTranslations("coordinator.messages");
  const tl = useTranslations("common.languages");
  const formId = useId();
  const { setEditing } = useCoordinatorLive();
  const nextKey = useRef(10_000);

  const serverVersion = hymnsFingerprint(props.initialHymns);
  const [state, dispatch] = useReducer(listSyncReducer<Row>, undefined, () =>
    initialListSync(keyedRows(props.initialHymns), serverVersion),
  );
  const [seenVersion, setSeenVersion] = useState(serverVersion);
  const [pending, startTransition] = useTransition();

  if (seenVersion !== serverVersion) {
    setSeenVersion(serverVersion);
    dispatch({
      type: "server_updated",
      items: keyedRows(props.initialHymns),
      version: serverVersion,
    });
  }

  const dirty = state.status === "dirty" || state.status === "conflict" || state.status === "error";
  useEffect(() => {
    setEditing(formId, dirty);
    return () => setEditing(formId, false);
  }, [formId, dirty, setEditing]);

  const add = () => {
    const key = nextKey.current;
    nextKey.current += 1;
    dispatch({ type: "edit", items: [...state.items, { key, en: "", de: "", ru: "" }] });
  };

  const change = (key: number, field: "en" | "de" | "ru", value: string) =>
    dispatch({
      type: "edit",
      items: state.items.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    });

  const remove = (key: number) =>
    dispatch({ type: "edit", items: state.items.filter((r) => r.key !== key) });

  function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("version", state.baseVersion);
    const snapshot = [...state.items];
    const nextFp = hymnsFingerprint(snapshot);
    dispatch({ type: "save_start" });
    startTransition(async () => {
      const res = await props.action({ status: "idle" }, form);
      if (res.status === "saved") {
        dispatch({ type: "save_ok", items: snapshot, version: nextFp });
      } else if (res.status === "stale") {
        dispatch({ type: "save_stale" });
      } else {
        dispatch({ type: "save_error", message: res.message ?? null });
      }
    });
  }

  const columns = { base: "2rem repeat(3, minmax(0, 1fr)) auto" };
  return (
    <chakra.form onSubmit={onSubmit} display="flex" flexDirection="column" gap="3">
      <Grid templateColumns={columns} gap="2" alignItems="center" fontSize="sm" color="fg.muted">
        <Text>{t("order")}</Text>
        <Text>{tl("en")}</Text>
        <Text>{tl("de")}</Text>
        <Text>{tl("ru")}</Text>
        <span />
      </Grid>
      {state.items.map((row, i) => (
        <Grid key={row.key} templateColumns={columns} gap="2" alignItems="center">
          <Text fontVariantNumeric="tabular-nums">{i + 1}</Text>
          <Input
            name="en"
            value={row.en}
            onChange={(e) => change(row.key, "en", e.currentTarget.value)}
            inputMode="numeric"
            required
            maxLength={20}
            aria-label={t("hymnNumber", { number: i + 1, language: tl("en") })}
          />
          <Input
            name="de"
            value={row.de ?? ""}
            onChange={(e) => change(row.key, "de", e.currentTarget.value)}
            inputMode="numeric"
            maxLength={20}
            aria-label={t("hymnNumber", { number: i + 1, language: tl("de") })}
          />
          <Input
            name="ru"
            value={row.ru ?? ""}
            onChange={(e) => change(row.key, "ru", e.currentTarget.value)}
            inputMode="numeric"
            maxLength={20}
            aria-label={t("hymnNumber", { number: i + 1, language: tl("ru") })}
          />
          <Button
            variant="ghost"
            size="sm"
            color="fg"
            onClick={() => remove(row.key)}
            aria-label={t("removeHymn", { number: i + 1 })}
          >
            {t("remove")}
          </Button>
        </Grid>
      ))}
      <ConflictBanner
        status={toBannerStatus(state.status)}
        conflicts={[]}
        onAcceptAllServer={() => dispatch({ type: "accept_server" })}
        onKeepLocal={() => dispatch({ type: "keep_local" })}
      />
      <HStack gap="3" wrap="wrap">
        <Button variant="outline" color="fg" onClick={add}>
          {t("addHymn")}
        </Button>
        <Button type="submit" loading={pending}>
          {t("saveHymns")}
        </Button>
      </HStack>
      <FormResult state={toFormResult(state.status, state.errorMessage)} saved={t("saved")} />
    </chakra.form>
  );
}
