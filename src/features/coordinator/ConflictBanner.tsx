"use client";

import { Button, HStack, List, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { Notice } from "@/components/ui/notice";
import type { DraftSyncStatus } from "@/lib/domain/draft-sync";

// Explains non-overlapping auto-merges calmly and resolves same-field
// collisions without wiping unsaved local edits.
export function ConflictBanner(props: {
  status: DraftSyncStatus;
  conflicts: readonly string[];
  fieldLabels?: Readonly<Record<string, string>>;
  serverValues?: Readonly<Record<string, string>>;
  onUseServerField?: (field: string) => void;
  onAcceptAllServer: () => void;
  onKeepLocal: () => void;
}) {
  const t = useTranslations("coordinator.sync");

  if (props.status === "remote_merged") {
    return (
      <Notice tone="neutral" announce="status">
        {t("merged")}
      </Notice>
    );
  }

  if (props.status !== "conflict") return null;

  return (
    <Notice tone="warning" announce="alert">
      <Stack gap="2">
        <Text fontWeight="medium">{t("conflictTitle")}</Text>
        <Text fontSize="sm">{t("conflictBody")}</Text>
        {props.conflicts.length > 0 && (
          <List.Root ps="4" gap="1.5" fontSize="sm">
            {props.conflicts.map((field) => {
              const label = props.fieldLabels?.[field] ?? field;
              const serverValue = props.serverValues?.[field] ?? "";
              return (
                <List.Item key={field}>
                  <HStack justify="space-between" wrap="wrap" gap="2">
                    <Text>
                      <Text as="span" fontWeight="medium">
                        {label}
                      </Text>
                      {serverValue ? `: ${serverValue}` : ""}
                    </Text>
                    {props.onUseServerField && (
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        color="fg"
                        onClick={() => props.onUseServerField?.(field)}
                      >
                        {t("useTheirs")}
                      </Button>
                    )}
                  </HStack>
                </List.Item>
              );
            })}
          </List.Root>
        )}
        <HStack gap="2" wrap="wrap">
          <Button
            type="button"
            size="xs"
            variant="outline"
            color="fg"
            onClick={props.onAcceptAllServer}
          >
            {t("acceptAll")}
          </Button>
          <Button type="button" size="xs" onClick={props.onKeepLocal}>
            {t("keepMine")}
          </Button>
        </HStack>
      </Stack>
    </Notice>
  );
}
