"use client";

import { useTranslations } from "next-intl";

import { Notice } from "@/components/ui/notice";

import type { FormState } from "./types";

// What happened after a coordinator form was sent. `message` overrides the
// text for an error the action names, such as a message someone has chosen.
export function FormResult({
  state,
  saved,
  focus = false,
  errorTone = "error",
}: {
  state: FormState;
  saved: string;
  focus?: boolean;
  errorTone?: "error" | "warning";
}) {
  const t = useTranslations("coordinator");
  const focusProp = focus ? { focus: true } : {};
  if (state.status === "saved") {
    return (
      <Notice tone="success" announce="status" {...focusProp}>
        {saved}
      </Notice>
    );
  }
  if (state.status === "error" || state.status === "stale") {
    return (
      <Notice tone={errorTone} announce="alert" {...focusProp}>
        {state.message ?? t(state.status)}
      </Notice>
    );
  }
  return null;
}
