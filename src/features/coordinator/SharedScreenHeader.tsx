"use client";

import { Flex, HStack, NativeSelect, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { StatusTag } from "@/components/ui/status-tag";
import { useRouter } from "@/i18n/navigation";

// Minimal header above an account-free shared screen: training name, live tag,
// and a message switcher to jump between messages in the hall.
export function SharedScreenHeader(props: {
  token: string;
  trainingTitle: string;
  messageNumber: number;
  sessions: readonly { number: number; label: string }[];
}) {
  const t = useTranslations("coordinator.screen");
  const router = useRouter();

  return (
    <Flex justify="space-between" align="center" gap="3" wrap="wrap">
      <HStack gap="2.5" wrap="wrap" minW="0">
        <Text fontSize="sm" fontWeight="semibold" color="fg">
          {props.trainingTitle}
        </Text>
        <StatusTag tone="brand">{t("live")}</StatusTag>
      </HStack>
      <NativeSelect.Root size="sm" width="auto">
        <NativeSelect.Field
          aria-label={t("selectMessage")}
          value={String(props.messageNumber)}
          onChange={(e) => {
            router.push(`/training/screen/${props.token}/${e.currentTarget.value}`);
          }}
        >
          {props.sessions.map((s) => (
            <option key={s.number} value={String(s.number)}>
              {s.label}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Flex>
  );
}
