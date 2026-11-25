"use client";

import { SimpleGrid, Stack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useOptimistic, useState, useTransition, type DragEvent } from "react";

import { Notice } from "@/components/ui/notice";
import type { Language } from "@/lib/domain/types";

import type { BoardGroup, GroupMember } from "./group-board";
import { StudyGroupCard } from "./StudyGroupCard";

type BoardState = {
  groups: readonly BoardGroup[];
  unassigned: readonly GroupMember[];
};

type MoveAction = {
  registrationId: string;
  fromGroupId: string | null;
  toGroupId: string;
};

function applyOptimisticMove(state: BoardState, action: MoveAction): BoardState {
  if (action.fromGroupId === action.toGroupId) return state;

  let moved: GroupMember | undefined;
  let nextUnassigned = state.unassigned;
  if (action.fromGroupId === null) {
    const filtered: GroupMember[] = [];
    for (const m of state.unassigned) {
      if (m.id === action.registrationId) moved = m;
      else filtered.push(m);
    }
    nextUnassigned = filtered;
  }

  const afterRemoval: BoardGroup[] = [];
  for (const g of state.groups) {
    if (g.id !== action.fromGroupId) {
      afterRemoval.push(g);
      continue;
    }
    const remaining: GroupMember[] = [];
    for (const m of g.members) {
      if (m.id === action.registrationId) moved = m;
      else remaining.push(m);
    }
    afterRemoval.push({ ...g, members: remaining });
  }

  if (!moved) return state;
  const member = moved;
  const nextGroups: BoardGroup[] = [];
  for (const g of afterRemoval) {
    nextGroups.push(g.id === action.toGroupId ? { ...g, members: [...g.members, member] } : g);
  }
  return { groups: nextGroups, unassigned: nextUnassigned };
}

// Interactive grid of study groups with drag-and-drop moves, inline language
// selection, and empty-group removal.
export function GroupsBoard(props: {
  groups: readonly BoardGroup[];
  unassigned: readonly GroupMember[];
  move: (registrationId: string, groupId: string) => Promise<void>;
  changeLanguage: (groupId: string, language: Language) => Promise<void>;
  removeEmpty: (groupId: string) => Promise<{ ok: true } | { ok: false; error: "not_empty" }>;
}) {
  const t = useTranslations("coordinator.groups");
  const tl = useTranslations("common.languages");
  const [board, addOptimisticMove] = useOptimistic(
    { groups: props.groups, unassigned: props.unassigned },
    applyOptimisticMove,
  );
  const [, startTransition] = useTransition();
  const [dragging, setDragging] = useState<{
    registrationId: string;
    fromGroupId: string | null;
  } | null>(null);
  const [overGroupId, setOverGroupId] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<"cannotRemoveNonEmpty" | "moveFailed" | null>(null);

  const label = (g: BoardGroup) => `${t("groupNumber", { number: g.number })} · ${tl(g.language)}`;
  const hasGroups = board.groups.length > 0;
  const canDrag = board.groups.length > 0;

  function performMove(registrationId: string, fromGroupId: string | null, toGroupId: string) {
    setErrorKey(null);
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        try {
          addOptimisticMove({ registrationId, fromGroupId, toGroupId });
          await props.move(registrationId, toGroupId);
        } catch {
          setErrorKey("moveFailed");
        } finally {
          resolve();
        }
      });
    });
  }

  function startDrag(
    registrationId: string,
    fromGroupId: string | null,
    e: DragEvent<HTMLElement>,
  ) {
    e.dataTransfer.setData("text/plain", registrationId);
    e.dataTransfer.effectAllowed = "move";
    setDragging({ registrationId, fromGroupId });
  }

  function endDrag() {
    setDragging(null);
    setOverGroupId(null);
  }

  function dragOver(targetGroupId: string, e: DragEvent<HTMLElement>) {
    if (!dragging || dragging.fromGroupId === targetGroupId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overGroupId !== targetGroupId) setOverGroupId(targetGroupId);
  }

  function dragLeave(targetGroupId: string, e: DragEvent<HTMLElement>) {
    const related = e.relatedTarget instanceof Node ? e.relatedTarget : null;
    if (related && e.currentTarget.contains(related)) return;
    if (overGroupId === targetGroupId) setOverGroupId(null);
  }

  function dropOn(targetGroupId: string, e: DragEvent<HTMLElement>) {
    e.preventDefault();
    const registrationId = dragging?.registrationId ?? e.dataTransfer.getData("text/plain");
    const fromGroupId = dragging?.fromGroupId ?? null;
    setDragging(null);
    setOverGroupId(null);
    if (!registrationId || fromGroupId === targetGroupId) return;
    void performMove(registrationId, fromGroupId, targetGroupId);
  }

  return (
    <Stack gap="4">
      {errorKey && <Notice tone="error">{t(errorKey)}</Notice>}
      <SimpleGrid minChildWidth="64" gap="4" alignItems="start">
        {board.unassigned.length > 0 && hasGroups && (
          <StudyGroupCard
            title={t("unassigned")}
            places={null}
            members={board.unassigned}
            targets={board.groups.map((g) => ({ id: g.id, label: label(g) }))}
            move={(regId, toId) => performMove(regId, null, toId)}
            checkSize={false}
            canDrag={canDrag}
            draggingId={dragging?.registrationId ?? null}
            onDragStartMember={(regId, e) => startDrag(regId, null, e)}
            onDragEndMember={endDrag}
          />
        )}
        {board.groups.map((g) => {
          const places = g.sites.join(", ") || g.localities.join(", ") || null;
          const canDropHere = Boolean(dragging && dragging.fromGroupId !== g.id);
          return (
            <StudyGroupCard
              key={g.id}
              groupId={g.id}
              groupNumber={g.number}
              title={t("groupNumber", { number: g.number })}
              language={g.language}
              places={places}
              members={g.members}
              targets={board.groups
                .filter((other) => other.id !== g.id)
                .map((other) => ({ id: other.id, label: label(other) }))}
              move={(regId, toId) => performMove(regId, g.id, toId)}
              checkSize
              onChangeLanguage={(lang) => {
                setErrorKey(null);
                return props.changeLanguage(g.id, lang);
              }}
              onRemoveEmpty={async () => {
                setErrorKey(null);
                const res = await props.removeEmpty(g.id);
                if (!res.ok) setErrorKey("cannotRemoveNonEmpty");
              }}
              canDrag={board.groups.length > 1}
              draggingId={dragging?.registrationId ?? null}
              isDropTarget={canDropHere && overGroupId === g.id}
              onDragStartMember={(regId, e) => startDrag(regId, g.id, e)}
              onDragEndMember={endDrag}
              onDragOverGroup={(e) => dragOver(g.id, e)}
              onDragLeaveGroup={(e) => dragLeave(g.id, e)}
              onDropOnGroup={(e) => dropOn(g.id, e)}
            />
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
