"use client";

import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";

import { MarkButton } from "@/components/ui/mark-button";
import { nextMark, type Mark } from "@/lib/domain/attendance";

// One box of the attendance table. A click moves it on: empty, present,
// absent, empty. A message someone did not have to come to is grey and can
// only be marked present.
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
  return (
    <MarkButton
      type="button"
      size="box"
      tone={!props.required && mark === null ? "optional" : (mark ?? "present")}
      aria-pressed={mark !== null}
      aria-label={`${props.label}: ${props.required ? state : `${state}, ${t("notRequiredShort")}`}`}
      title={`${props.label}: ${state}`}
      onClick={() => {
        const next = nextMark(mark, props.required);
        startTransition(async () => {
          setMark(next);
          await props.save(next);
        });
      }}
    >
      {mark === null ? "" : t(`short.${mark}`)}
    </MarkButton>
  );
}
