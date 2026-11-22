"use client";

import { Button, Flex, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

// A message's hymns and verses, read only until someone presses Edit, so
// nothing changes by accident during a session.
export function MessageEditor(props: { number: number; read: ReactNode; edit: ReactNode }) {
  const t = useTranslations("coordinator.messages");
  const [editing, setEditing] = useState(false);
  return (
    <Stack gap="10">
      <Flex justify="space-between" align="center" gap="3" wrap="wrap">
        <Text fontSize="sm" color="fg.muted">
          {editing ? t("editHelp") : t("readOnly")}
        </Text>
        {editing ? (
          <Button onClick={() => setEditing(false)}>{t("done")}</Button>
        ) : (
          <Button variant="outline" color="fg" onClick={() => setEditing(true)}>
            {t("edit", { number: props.number })}
          </Button>
        )}
      </Flex>
      {editing ? props.edit : props.read}
    </Stack>
  );
}
