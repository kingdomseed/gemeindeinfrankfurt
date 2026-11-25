"use client";

import { Box } from "@chakra-ui/react";
import { useFormatter, useTranslations } from "next-intl";

import { StatusTag } from "@/components/ui/status-tag";

import { useCoordinatorLive } from "./LiveWorkspace";

// Shows which other coordinators have this same page open (and whether any
// have unsaved changes), using ephemeral Presence without manual locks.
export function PresenceBar() {
  const { peersOnPage } = useCoordinatorLive();
  const t = useTranslations("coordinator.presence");
  const format = useFormatter();

  if (peersOnPage.length === 0) return null;

  const editingNames = peersOnPage.filter((p) => p.editing).map((p) => p.name);
  const viewingNames = peersOnPage.filter((p) => !p.editing).map((p) => p.name);

  return (
    <Box
      as="output"
      display="flex"
      flexWrap="wrap"
      gap="2"
      aria-live="polite"
      _print={{ display: "none" }}
    >
      {editingNames.length > 0 && (
        <StatusTag tone="warning">
          {t("editing", { names: format.list(editingNames, { type: "conjunction" }) })}
        </StatusTag>
      )}
      {viewingNames.length > 0 && (
        <StatusTag tone="neutral">
          {t("viewing", { names: format.list(viewingNames, { type: "conjunction" }) })}
        </StatusTag>
      )}
    </Box>
  );
}
