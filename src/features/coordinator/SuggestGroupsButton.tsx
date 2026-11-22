"use client";

import { Button, Dialog, Portal } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

// Makes the groups from scratch. Once there are groups, it asks first, since
// moves made by hand and the planned tests are lost.
export function SuggestGroupsButton(props: { hasGroups: boolean; suggest: () => Promise<void> }) {
  const t = useTranslations("coordinator.groups");
  const [pending, startTransition] = useTransition();
  const run = () => startTransition(() => props.suggest());

  if (!props.hasGroups) {
    return (
      <Button loading={pending} onClick={run}>
        {t("suggest")}
      </Button>
    );
  }
  return (
    <Dialog.Root role="alertdialog">
      <Dialog.Trigger asChild>
        <Button variant="outline" color="fg" loading={pending}>
          {t("suggestAgain")}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t("suggestAgainTitle")}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>{t("suggestAgainBody")}</Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" color="fg">
                  {t("keepGroups")}
                </Button>
              </Dialog.ActionTrigger>
              <Dialog.ActionTrigger asChild>
                <Button colorPalette="danger" onClick={run}>
                  {t("replaceGroups")}
                </Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
