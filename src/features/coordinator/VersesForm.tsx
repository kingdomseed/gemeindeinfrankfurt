"use client";

import { Button, chakra, Fieldset, HStack, Input, Textarea } from "@chakra-ui/react";
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

import { FormField } from "@/components/ui/form-field";
import type { DraftSyncStatus } from "@/lib/domain/draft-sync";
import { initialListSync, listSyncReducer, versesFingerprint } from "@/lib/domain/list-sync";
import type { Verse } from "@/lib/domain/messages";
import { languages } from "@/lib/domain/types";

import { ConflictBanner } from "./ConflictBanner";
import { FormResult } from "./FormResult";
import { useCoordinatorLive } from "./LiveWorkspace";
import type { FormAction, FormState } from "./types";

type Row = Verse & { key: number };

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

function keyedRows(list: readonly Verse[]): Row[] {
  return list.map((v, i) => ({ ...v, key: i }));
}

// The verses of one message in reading order, one slide each, with the text
// in every language the screens show.
export function VersesForm(props: {
  // What is saved now; the form keeps its own copy while it is open.
  initialVerses: readonly Verse[];
  action: FormAction;
}) {
  const t = useTranslations("coordinator.messages");
  const tl = useTranslations("common.languages");
  const formId = useId();
  const { setEditing } = useCoordinatorLive();
  const nextKey = useRef(10_000);

  const serverVersion = versesFingerprint(props.initialVerses);
  const [state, dispatch] = useReducer(listSyncReducer<Row>, undefined, () =>
    initialListSync(keyedRows(props.initialVerses), serverVersion),
  );
  const [seenVersion, setSeenVersion] = useState(serverVersion);
  const [pending, startTransition] = useTransition();

  if (seenVersion !== serverVersion) {
    setSeenVersion(serverVersion);
    dispatch({
      type: "server_updated",
      items: keyedRows(props.initialVerses),
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
    dispatch({ type: "edit", items: [...state.items, { key, ref: "", text: {} }] });
  };

  const change = (key: number, update: (row: Row) => Row) =>
    dispatch({
      type: "edit",
      items: state.items.map((r) => (r.key === key ? update(r) : r)),
    });

  const remove = (key: number) =>
    dispatch({ type: "edit", items: state.items.filter((r) => r.key !== key) });

  function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("version", state.baseVersion);
    const snapshot = [...state.items];
    const nextFp = versesFingerprint(snapshot);
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

  return (
    <chakra.form onSubmit={onSubmit} display="flex" flexDirection="column" gap="4">
      {state.items.map((row, i) => (
        <Fieldset.Root key={row.key} borderWidth="1px" rounded="lg" p="4" gap="3">
          <Fieldset.Legend fontWeight="medium">
            {t("verseNumber", { number: i + 1 })}
          </Fieldset.Legend>
          <FormField label={t("reference")}>
            <Input
              name="ref"
              value={row.ref}
              onChange={(e) => {
                const ref = e.currentTarget.value;
                change(row.key, (r) => ({ ...r, ref }));
              }}
              required
              maxLength={100}
            />
          </FormField>
          {languages.map((l) => (
            <FormField key={l} label={tl(l)}>
              <Textarea
                name={`text_${l}`}
                value={row.text[l] ?? ""}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  change(row.key, (r) => ({ ...r, text: { ...r.text, [l]: value } }));
                }}
                rows={3}
                maxLength={4000}
                lang={l}
              />
            </FormField>
          ))}
          <Button
            variant="ghost"
            size="sm"
            color="fg"
            alignSelf="flex-start"
            onClick={() => remove(row.key)}
          >
            {t("removeVerse", { number: i + 1 })}
          </Button>
        </Fieldset.Root>
      ))}
      <ConflictBanner
        status={toBannerStatus(state.status)}
        conflicts={[]}
        onAcceptAllServer={() => dispatch({ type: "accept_server" })}
        onKeepLocal={() => dispatch({ type: "keep_local" })}
      />
      <HStack gap="3" wrap="wrap">
        <Button variant="outline" color="fg" onClick={add}>
          {t("addVerse")}
        </Button>
        <Button type="submit" loading={pending}>
          {t("saveVerses")}
        </Button>
      </HStack>
      <FormResult state={toFormResult(state.status, state.errorMessage)} saved={t("saved")} />
    </chakra.form>
  );
}
