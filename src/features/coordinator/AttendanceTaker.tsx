"use client";

import { Flex, HStack, List, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { MarkButton } from "@/components/ui/mark-button";
import type { Mark } from "@/lib/domain/attendance";

export type TakerPerson = { id: string; name: string; note: string; required: boolean };
type Change = { registrationId: string; sessionId: string; mark: Mark | null };
type Pending = Record<string, Mark | null>;

const RETRY_MS = 10_000;

function readPending(key: string): Pending {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (typeof parsed !== "object" || parsed === null) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, Mark | null] =>
          entry[1] === "present" || entry[1] === "absent" || entry[1] === null,
      ),
    );
  } catch {
    return {};
  }
}

function writePending(key: string, pending: Pending) {
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
  const [pending, setPending] = useState<Pending>({});
  const [failed, setFailed] = useState(false);
  const [, startTransition] = useTransition();
  const pendingRef = useRef<Pending>({});
  const { save, sessionId } = props;

  const update = useCallback(
    (next: Pending) => {
      pendingRef.current = next;
      writePending(storageKey, next);
      setPending(next);
    },
    [storageKey],
  );

  const flush = useCallback(() => {
    const sent = pendingRef.current;
    const changes = Object.entries(sent).map(([registrationId, mark]) => ({
      registrationId,
      sessionId,
      mark,
    }));
    if (changes.length === 0) return;
    startTransition(async () => {
      try {
        await save(changes);
        // Keep only what changed again while this was on its way.
        const left = Object.fromEntries(
          Object.entries(pendingRef.current).filter(([id, mark]) => sent[id] !== mark),
        );
        update(left);
        setFailed(false);
      } catch {
        setFailed(true);
      }
    });
  }, [save, sessionId, update]);

  useEffect(() => {
    pendingRef.current = readPending(storageKey);
    setPending(pendingRef.current);
    flush();
    const retry = window.setInterval(flush, RETRY_MS);
    window.addEventListener("online", flush);
    return () => {
      window.clearInterval(retry);
      window.removeEventListener("online", flush);
    };
  }, [storageKey, flush]);

  const markOf = (id: string): Mark | null =>
    id in pending ? (pending[id] ?? null) : (props.marks[id] ?? null);
  const toggle = (id: string, mark: Mark) => {
    update({ ...pendingRef.current, [id]: markOf(id) === mark ? null : mark });
    flush();
  };

  const required = props.people.filter((p) => p.required);
  const present = required.filter((p) => markOf(p.id) === "present").length;
  const absent = required.filter((p) => markOf(p.id) === "absent").length;
  const waiting = Object.keys(pending).length;
  let syncText = t("allSaved");
  if (waiting > 0) syncText = failed ? t("offline", { count: waiting }) : t("saving");

  return (
    <Stack gap="3">
      <Flex justify="space-between" gap="3" wrap="wrap" align="center">
        <Text fontSize="sm" aria-live="polite" fontVariantNumeric="tabular-nums">
          {t("counts", { present, absent, open: required.length - present - absent })}
        </Text>
        <Text fontSize="sm" color={waiting > 0 && failed ? "fg.warning" : "fg.muted"}>
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
