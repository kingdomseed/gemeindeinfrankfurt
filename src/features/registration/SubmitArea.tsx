import { Button, Stack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { CheckboxChoice } from "@/components/ui/choice";
import { Notice } from "@/components/ui/notice";

// Statuses that mean the action worked; everything else is shown as a problem.
const successStatuses = new Set(["done", "saved"]);

// The answer to the last submit, next to the button where the person is looking.
export function SubmitArea(props: {
  status: string;
  message?: string | undefined;
  pending: boolean;
  label: string;
}) {
  const t = useTranslations("register");
  const success = successStatuses.has(props.status);
  return (
    <Stack gap="4" align="flex-start">
      {props.message && (
        <Notice
          tone={success ? "success" : "warning"}
          announce={success ? "status" : "alert"}
          focus
        >
          {props.message}
        </Notice>
      )}
      {props.status === "duplicate" && (
        <CheckboxChoice name="confirm_duplicate" required>
          {t("registerAnyway")}
        </CheckboxChoice>
      )}
      <Button
        type="submit"
        px="6"
        disabled={props.pending}
        cursor={props.pending ? "wait" : undefined}
      >
        {props.pending ? t("sending") : props.label}
      </Button>
    </Stack>
  );
}
