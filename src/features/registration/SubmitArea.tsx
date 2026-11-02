import { Button, Stack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { CheckboxChoice } from "@/components/ui/choice";
import { Notice } from "@/components/ui/notice";

// The answer to the last submit, next to the button where the person is looking.
export function SubmitArea(props: {
  message?: string | undefined;
  success: boolean;
  duplicate: boolean;
  pending: boolean;
  label: string;
}) {
  const t = useTranslations("register");
  return (
    <Stack gap="4" align="flex-start">
      {props.message && (
        <Notice
          tone={props.success ? "success" : "warning"}
          announce={props.success ? "status" : "alert"}
          focus
        >
          {props.message}
        </Notice>
      )}
      {props.duplicate && (
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
