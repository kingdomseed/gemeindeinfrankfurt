import { Flex, Link, List, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { StatusTag } from "@/components/ui/status-tag";
import { Link as LocaleLink } from "@/i18n/navigation";
import type { Readiness } from "@/lib/domain/messages";

import { messageHref } from "./sections";

export type MessageListItem = { number: number; day: string; readiness: Readiness };

// Every message of the training with whether its hymns and verses are ready.
export function MessageList(props: { messages: readonly MessageListItem[]; current: number }) {
  const t = useTranslations("coordinator.messages");
  return (
    <List.Root as="ol" listStyle="none" borderTopWidth="1px">
      {props.messages.map((m) => {
        const current = m.number === props.current;
        const r = m.readiness;
        return (
          <List.Item key={m.number} borderBottomWidth="1px">
            <Link
              asChild
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              gap="2"
              minH="11"
              px="2"
              py="1.5"
              rounded="sm"
              color="fg"
              textDecoration="none"
              bg={current ? "brand.subtle" : undefined}
              _hover={{ bg: current ? "brand.subtle" : "bg.muted" }}
            >
              <LocaleLink href={messageHref(m.number)} aria-current={current ? "page" : undefined}>
                <Stack gap="0">
                  <Text fontVariantNumeric="tabular-nums">
                    {t("message", { number: m.number })}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {m.day}
                  </Text>
                </Stack>
                <Flex flexShrink="0">
                  {r.status === "ready" && <StatusTag tone="success">{t("ready")}</StatusTag>}
                  {r.status === "missing" && (
                    <StatusTag tone="warning">{t("missing", { count: r.count })}</StatusTag>
                  )}
                  {r.status === "empty" && <StatusTag>{t("empty")}</StatusTag>}
                </Flex>
              </LocaleLink>
            </Link>
          </List.Item>
        );
      })}
    </List.Root>
  );
}
