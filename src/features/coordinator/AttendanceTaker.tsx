"use client";

import { Flex, HStack, List, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useReducer, useRef, useTransition } from "react";

import { MarkButton } from "@/components/ui/mark-button";
import type { Mark } from "@/lib/domain/attendance";
import {
  attendanceSyncReducer,
  initialAttendanceSync,
  type PendingMarks,
} from "@/lib/domain/attendance-sync";

export type TakerPerson = { id: string; name: string; note: string; required: boolean };
type Change = { registrationId: string; sessionId: string; mark: Mark | null };

const RETRY_MS = 10_000;

function readPending(key: string): PendingMarks {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (typeof parsed !== "object" || parsed === null) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, Mark | null] =>
          entry[1] === "present" ||
          entry[1] === "absent" ||
          entry[1] === "excused" ||
          entry[1] === null,
      ),
    );
  } catch {
    return {};
  }
}

function writePending(key: string, pending: PendingMarks) {
  try {
    if (Object.keys(pending).length === 0) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(pending));
  } catch {
    // Private mode or full storage: the marks still go to the server.
  }
}

// Present and absent buttons for each person at one message. A mark is kept
// on the phone first and sent as soon as there is a connection, so a weak
// Wi-Fi in the room loses nothing.
export function AttendanceTaker(props: {
  sessionId: string;
  people: readonly TakerPerson[];
  marks: Readonly<Record<string, Mark>>;
  save: (changes: Change[]) => Promise<void>;
}) {
  const t = useTranslations("coordinator.attendance");
  const storageKey = `attendance:${props.sessionId}`;
  const [syncState, dispatch] = useReducer(attendanceSyncReducer, initialAttendanceSync);
  const [, startTransition] = useTransition();
  const pendingRef = useRef<PendingMarks>({});
  const { save, sessionId } = props;

  useEffect(() => {
    writePending(storageKey, syncState.pending);
    pendingRef.current = syncState.pending;
  }, [storageKey, syncState.pending]);

  const flush = useCallback(() => {
    const sent = { ...readPending(storageKey), ...pendingRef.current };
    const changes = Object.entries(sent).map(([registrationId, mark]) => ({
      registrationId,
      sessionId,
      mark,
    }));
    if (changes.length === 0) return;
    dispatch({ type: "flush_start" });
    startTransition(async () => {
      try {
        await save(changes);
        dispatch({ type: "flush_succeeded", sent, stored: readPending(storageKey) });
      } catch {
        dispatch({ type: "flush_failed" });
      }
    });
  }, [save, sessionId, storageKey]);

  useEffect(() => {
    const stored = readPending(storageKey);
    pendingRef.current = stored;
    dispatch({ type: "hydrate", stored });
    flush();
    const retry = window.setInterval(flush, RETRY_MS);
    window.addEventListener("online", flush);
    return () => {
      window.clearInterval(retry);
      window.removeEventListener("online", flush);
    };
  }, [storageKey, flush]);

  const { pending } = syncState;
  const markOf = (id: string): Mark | null =>
    id in pending ? (pending[id] ?? null) : (props.marks[id] ?? null);
  const toggle = (id: string, mark: Mark) => {
    const next = markOf(id) === mark ? null : mark;
    const stored = readPending(storageKey);
    pendingRef.current = { ...stored, ...pendingRef.current, [id]: next };
    writePending(storageKey, pendingRef.current);
    dispatch({ type: "toggle", id, next, stored });
    flush();
  };

  const required = props.people.filter((p) => p.required);
  const present = required.filter((p) => markOf(p.id) === "present").length;
  const absent = required.filter((p) => {
    const m = markOf(p.id);
    return m === "absent" || m === "excused";
  }).length;
  const waiting = Object.keys(pending).length;
  let syncText = t("allSaved");
  if (waiting > 0) {
    syncText = syncState.phase === "offline" ? t("offline", { count: waiting }) : t("saving");
  }

  return (
    <Stack gap="3">
      <Flex justify="space-between" gap="3" wrap="wrap" align="center">
        <Text fontSize="sm" aria-live="polite" fontVariantNumeric="tabular-nums">
          {t("counts", { present, absent, open: required.length - present - absent })}
        </Text>
        <Text
          fontSize="sm"
          color={waiting > 0 && syncState.phase === "offline" ? "fg.warning" : "fg.muted"}
        >
          {syncText}
        </Text>
      </Flex>
      <List.Root listStyle="none" borderTopWidth="1px">
        {props.people.map((p) => {
          const mark = markOf(p.id);
          return (
            <List.Item key={p.id} display="block" py="2.5" borderBottomWidth="1px">
              <Flex justify="space-between" gap="2" mb="1.5">
                <Text fontWeight="medium">{p.name}</Text>
                <Text fontSize="xs" color="fg.muted">
                  {p.note}
                </Text>
              </Flex>
              {p.required ? (
                <HStack as="fieldset" aria-label={p.name} gap="1" borderWidth="0" p="0" m="0">
                  <MarkButton
                    type="button"
                    tone="present"
                    aria-pressed={mark === "present"}
                    onClick={() => toggle(p.id, "present")}
                  >
                    {t("present")}
                  </MarkButton>
                  <MarkButton
                    type="button"
                    tone="excused"
                    aria-pressed={mark === "excused"}
                    onClick={() => toggle(p.id, "excused")}
                  >
                    {t("excused")}
                  </MarkButton>
                  <MarkButton
                    type="button"
                    tone="absent"
                    aria-pressed={mark === "absent"}
                    onClick={() => toggle(p.id, "absent")}
                  >
                    {t("absent")}
                  </MarkButton>
                </HStack>
              ) : (
                <Flex
                  justify="space-between"
                  align="center"
                  gap="2"
                  bg="bg.muted"
                  color="fg.muted"
                  rounded="sm"
                  ps="3"
                >
                  <Text fontSize="sm">{t("notRequired")}</Text>
                  <MarkButton
                    type="button"
                    tone="present"
                    flex="0 0 auto"
                    px="4"
                    aria-pressed={mark === "present"}
                    onClick={() => toggle(p.id, "present")}
                  >
                    {t("present")}
                  </MarkButton>
                </Flex>
              )}
            </List.Item>
          );
        })}
      </List.Root>
    </Stack>
  );
}
