"use client";

import { Flex, Menu, Portal, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useOptimistic, useTransition, type KeyboardEvent } from "react";

import { MarkButton } from "@/components/ui/mark-button";
import { markFromKey, nextMark, type Mark } from "@/lib/domain/attendance";

const MARKS: readonly Mark[] = ["present", "absent", "excused"];

// One box of the attendance table. Required messages open a direct pick menu
// (Present, Absent, Excused, Clear) and respond to the single-letter shortcuts
// when focused. Optional messages toggle with one click or the Present key.
export function AttendanceCell(props: {
  mark: Mark | null;
  required: boolean;
  label: string;
  save: (mark: Mark | null) => Promise<void>;
}) {
  const t = useTranslations("coordinator.attendance");
  const [mark, setMark] = useOptimistic(props.mark);
  const [, startTransition] = useTransition();
  const state = mark === null ? t("open") : t(mark);
  const shortKeys = {
    present: t("short.present"),
    absent: t("short.absent"),
    excused: t("short.excused"),
  };

  function applyMark(next: Mark | null) {
    if (next === mark) return;
    startTransition(async () => {
      setMark(next);
      await props.save(next);
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const result = markFromKey(e.key, props.required, shortKeys);
    if (!result.matched) return;
    e.preventDefault();
    applyMark(result.mark);
  }

  const buttonProps = {
    type: "button" as const,
    size: "box" as const,
    tone: !props.required && mark === null ? ("optional" as const) : (mark ?? ("present" as const)),
    "aria-pressed": mark !== null,
    "aria-label": `${props.label}: ${props.required ? state : `${state}, ${t("notRequiredShort")}`}`,
    title: `${props.label}: ${state}`,
    onKeyDown: handleKeyDown,
  };

  const cellText = mark === null ? "" : shortKeys[mark];

  if (!props.required) {
    return (
      <MarkButton {...buttonProps} onClick={() => applyMark(nextMark(mark, false))}>
        {cellText}
      </MarkButton>
    );
  }

  return (
    <Menu.Root
      positioning={{ placement: "bottom-start" }}
      onSelect={({ value }) => {
        if (value === "clear") applyMark(null);
        else if (value === "present" || value === "absent" || value === "excused") applyMark(value);
      }}
    >
      <Menu.Trigger asChild>
        <MarkButton {...buttonProps}>{cellText}</MarkButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="10rem">
            {MARKS.map((m) => (
              <Menu.Item key={m} value={m}>
                <Flex w="full" align="center" justify="space-between" gap="3">
                  <span>{t(m)}</span>
                  <Text as="kbd" fontSize="xs" color="fg.muted">
                    {shortKeys[m]}
                  </Text>
                </Flex>
              </Menu.Item>
            ))}
            <Menu.Item value="clear" disabled={mark === null}>
              <Flex w="full" align="center" justify="space-between" gap="3">
                <span>{t("clearMark")}</span>
                <Text as="kbd" fontSize="xs" color="fg.muted">
                  ⌫
                </Text>
              </Flex>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
