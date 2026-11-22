"use client";

import { Button, Menu, Portal } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

// "Move" beside a person: the other groups to put them in.
export function MoveMenu(props: {
  personName: string;
  groups: readonly { id: string; label: string }[];
  move: (groupId: string) => Promise<void>;
}) {
  const t = useTranslations("coordinator.groups");
  const [pending, startTransition] = useTransition();
  return (
    <Menu.Root
      onSelect={({ value }) => {
        startTransition(() => props.move(value));
      }}
    >
      <Menu.Trigger asChild>
        <Button
          variant="ghost"
          size="xs"
          color="fg"
          loading={pending}
          aria-label={t("moveName", { name: props.personName })}
        >
          {t("move")}
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {props.groups.map((g) => (
              <Menu.Item key={g.id} value={g.id}>
                {g.label}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
