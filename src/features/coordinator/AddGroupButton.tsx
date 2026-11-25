"use client";

import { Button } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

// Creates a new empty study group so coordinators can organize people manually.
export function AddGroupButton(props: { add: () => Promise<void> }) {
  const t = useTranslations("coordinator.groups");
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      color="fg"
      loading={pending}
      onClick={() => startTransition(() => props.add())}
    >
      {t("addGroup")}
    </Button>
  );
}
