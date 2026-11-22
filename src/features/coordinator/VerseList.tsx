import { Flex, HStack, List, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { StatusTag } from "@/components/ui/status-tag";
import { occurrenceKeys, type Verse } from "@/lib/domain/messages";
import { languages } from "@/lib/domain/types";

// The verses of a message in reading order, and which languages have their text.
export function VerseList({ verses }: { verses: readonly Verse[] }) {
  const t = useTranslations("coordinator.messages");
  if (verses.length === 0) return <Text color="fg.muted">{t("noVerses")}</Text>;
  const keys = occurrenceKeys(verses.map((v) => v.ref));
  return (
    <List.Root as="ol" listStyle="none" borderTopWidth="1px">
      {verses.map((v, i) => (
        <List.Item key={keys[i]} display="block" py="2" borderBottomWidth="1px">
          <Flex justify="space-between" gap="4" wrap="wrap" align="center">
            <Text>
              <Text as="span" color="fg.muted" fontVariantNumeric="tabular-nums" me="3">
                {i + 1}
              </Text>
              {v.ref}
            </Text>
            <HStack gap="1">
              {languages.map((l) =>
                v.text[l]?.trim() ? (
                  <StatusTag key={l} tone="success">
                    {l.toUpperCase()}
                  </StatusTag>
                ) : (
                  <StatusTag key={l} tone="warning">
                    {t("missingLanguage", { language: l.toUpperCase() })}
                  </StatusTag>
                ),
              )}
            </HStack>
          </Flex>
        </List.Item>
      ))}
    </List.Root>
  );
}
