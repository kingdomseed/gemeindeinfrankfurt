"use client";

import { useTranslations } from "next-intl";

import { Notice } from "@/components/ui/notice";

import type { FormState } from "./types";

// What happened after a coordinator form was sent. `message` overrides the
// text for an error the action names, such as a message someone has chosen.
export function FormResult({ state, saved }: { state: FormState; saved: string }) {
  const t = useTranslations("coordinator");
  if (state.status === "saved") {
    return (
      <Notice tone="success" announce="status">
        {saved}
      </Notice>
    );
  }
  if (state.status === "error" || state.status === "stale") {
    return (
      <Notice tone="error" announce="alert">
        {state.message ?? t(state.status)}
      </Notice>
    );
  }
  return null;
}
