"use client";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  List,
  NativeSelect,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useTransition, type DragEvent } from "react";

import { Card } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { groupSizeOk } from "@/lib/domain/groups";
import { languages, type Language } from "@/lib/domain/types";

import type { GroupMember } from "./group-board";
import { MoveMenu } from "./MoveMenu";

function isLanguage(value: string): value is Language {
  return value === "de" || value === "en" || value === "ru";
}

function GripIcon() {
  return (
    <Box as="span" color="fg.muted" flexShrink={0} display="inline-flex" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <circle cx="4" cy="2.5" r="1" />
        <circle cx="8" cy="2.5" r="1" />
        <circle cx="4" cy="6" r="1" />
        <circle cx="8" cy="6" r="1" />
        <circle cx="4" cy="9.5" r="1" />
        <circle cx="8" cy="9.5" r="1" />
      </svg>
    </Box>
  );
}

// One study group, or the people in none: supports drag-and-drop between groups,
// inline language switching, removing empty groups, and keyboard-friendly Move menus.
export function StudyGroupCard(props: {
  groupId?: string | undefined;
  groupNumber?: number | undefined;
  title: string;
  language?: Language | undefined;
  places: string | null;
  members: readonly GroupMember[];
  targets: readonly { id: string; label: string }[];
  move: (registrationId: string, groupId: string) => Promise<void>;
  checkSize: boolean;
  onChangeLanguage?: ((language: Language) => Promise<void>) | undefined;
  onRemoveEmpty?: (() => Promise<void>) | undefined;
  canDrag?: boolean | undefined;
  draggingId?: string | null | undefined;
  isDropTarget?: boolean | undefined;
  onDragStartMember?: ((registrationId: string, e: DragEvent<HTMLElement>) => void) | undefined;
  onDragEndMember?: (() => void) | undefined;
  onDragOverGroup?: ((e: DragEvent<HTMLElement>) => void) | undefined;
  onDragLeaveGroup?: ((e: DragEvent<HTMLElement>) => void) | undefined;
  onDropOnGroup?: ((e: DragEvent<HTMLElement>) => void) | undefined;
}) {
  const t = useTranslations("coordinator");
  const tl = useTranslations("common.languages");
  const [pending, startTransition] = useTransition();
  const size = props.members.length;
  const isEmpty = size === 0;

  return (
    <Card
      as="section"
      gap="3"
      borderColor={props.isDropTarget ? "brand.solid" : undefined}
      bg={props.isDropTarget ? "brand.subtle" : undefined}
      transition="background-color 120ms ease, border-color 120ms ease"
      onDragOver={props.onDragOverGroup}
      onDragLeave={props.onDragLeaveGroup}
      onDrop={props.onDropOnGroup}
      data-group-id={props.groupId}
    >
      <Stack gap="1.5">
        <Flex justify="space-between" align="center" gap="2">
          <Heading as="h2" size="md">
            {props.title}
          </Heading>
          <HStack gap="2">
            {isEmpty && props.onRemoveEmpty && (
              <Button
                type="button"
                size="xs"
                variant="ghost"
                color="fg.error"
                loading={pending}
                aria-label={
                  props.groupNumber !== undefined
                    ? t("groups.removeGroupName", { number: props.groupNumber })
                    : t("groups.removeGroup")
                }
                onClick={() => startTransition(() => props.onRemoveEmpty?.())}
              >
                {t("groups.removeGroup")}
              </Button>
            )}
            <StatusTag
              tone={props.checkSize && !groupSizeOk(size) ? "warning" : "neutral"}
              fontVariantNumeric="tabular-nums"
            >
              {t("groups.people", { count: size })}
            </StatusTag>
          </HStack>
        </Flex>
        {(props.language !== undefined || props.places) && (
          <Flex align="center" gap="2" wrap="wrap">
            {props.language !== undefined && props.onChangeLanguage && (
              <NativeSelect.Root size="xs" w="auto" minW="24" disabled={pending}>
                <NativeSelect.Field
                  value={props.language}
                  aria-label={
                    props.groupNumber !== undefined
                      ? t("groups.groupLanguage", { number: props.groupNumber })
                      : tl(props.language)
                  }
                  onChange={(e) => {
                    const next = e.currentTarget.value;
                    if (!isLanguage(next) || next === props.language) return;
                    startTransition(() => props.onChangeLanguage?.(next));
                  }}
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {tl(lang)}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            )}
            {props.places && (
              <Text fontSize="sm" color="fg.muted">
                {props.places}
              </Text>
            )}
          </Flex>
        )}
      </Stack>

      {isEmpty ? (
        <Box borderTopWidth="1px" pt="3" pb="1">
          <Text fontSize="sm" color="fg.muted">
            {t("groups.emptyGroup")}
          </Text>
        </Box>
      ) : (
        <List.Root listStyle="none" borderTopWidth="1px">
          {props.members.map((m) => {
            const draggable = Boolean(props.canDrag && props.onDragStartMember);
            const dragging = props.draggingId === m.id;
            return (
              <List.Item
                key={m.id}
                draggable={draggable}
                onDragStart={(e) => props.onDragStartMember?.(m.id, e)}
                onDragEnd={() => props.onDragEndMember?.()}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap="2"
                minH="11"
                borderBottomWidth="1px"
                cursor={draggable ? "grab" : undefined}
                opacity={dragging ? 0.45 : 1}
                data-member-id={m.id}
              >
                <HStack gap="2" minW="0">
                  {draggable && <GripIcon />}
                  <Text fontSize="sm">
                    {m.name}
                    {m.seat !== "full_time" && (
                      <Text as="span" fontSize="xs" color="fg.muted">
                        {` ${t(`seatShort.${m.seat}`)}`}
                      </Text>
                    )}
                  </Text>
                </HStack>
                {props.targets.length > 0 && (
                  <MoveMenu
                    personName={m.name}
                    groups={props.targets}
                    move={props.move.bind(null, m.id)}
                  />
                )}
              </List.Item>
            );
          })}
        </List.Root>
      )}
    </Card>
  );
}
