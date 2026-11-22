"use client";

import { NativeSelect } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

// The group that tests before one message. Saved as soon as it changes.
export function TestSlotSelect(props: {
  sessionId: string;
  messageNumber: number;
  groupId: string | null;
  groups: readonly { id: string; label: string }[];
  save: (form: FormData) => Promise<void>;
}) {
  const t = useTranslations("coordinator.testing");
  return (
    <form action={props.save}>
      <input type="hidden" name="session_id" value={props.sessionId} />
      <NativeSelect.Root>
        <NativeSelect.Field
          name="group_id"
          defaultValue={props.groupId ?? ""}
          aria-label={t("testBefore", { number: props.messageNumber })}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        >
          <option value="">{t("noTest")}</option>
          {props.groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </form>
  );
}
