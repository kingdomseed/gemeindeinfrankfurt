"use client";

import { Box, Button, Flex, Input, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { FormField } from "@/components/ui/form-field";
import { inListFilter, listFilters, type ListFilter } from "@/lib/domain/payments";

import { displayName } from "./display";
import { RegistrationCards } from "./RegistrationCards";
import { RegistrationTable } from "./RegistrationTable";
import type { RegistrationRow } from "./types";

// Every registration, read only: search and filter, then cards on phones and a
// table on wider screens. Payments are marked on the registration's own page.
export function RegistrationList(props: {
  rows: readonly RegistrationRow[];
  initialFilter: ListFilter;
  initialQuery: string;
}) {
  const { rows } = props;
  const t = useTranslations("coordinator");
  const [query, setQuery] = useState(props.initialQuery);
  const [filter, setFilter] = useState<ListFilter>(props.initialFilter);
  const needle = query.trim().toLowerCase();
  const inFilter = (f: ListFilter) => rows.filter((r) => inListFilter(r.registration, r.fees, f));
  const shown = inFilter(filter).filter(
    ({ registration: r }) =>
      needle === "" || `${displayName(r)} ${r.email}`.toLowerCase().includes(needle),
  );
  return (
    <Stack gap="4">
      <Box maxW="md">
        <FormField label={t("search")}>
          <Input
            type="search"
            value={query}
            placeholder={t("searchPlaceholder")}
            onChange={(e) => setQuery(e.target.value)}
          />
        </FormField>
      </Box>
      <Flex as="fieldset" aria-label={t("show")} wrap="wrap" gap="2" borderWidth="0">
        {listFilters.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={f === filter ? "solid" : "outline"}
            aria-pressed={f === filter}
            onClick={() => setFilter(f)}
          >
            {t(`filter.${f}`)} · {inFilter(f).length}
          </Button>
        ))}
      </Flex>
      <Text fontSize="sm" color="fg.muted">
        {t("readOnly")}
      </Text>
      {shown.length === 0 ? (
        <Text as="output">{t("noMatches")}</Text>
      ) : (
        <>
          <RegistrationCards rows={shown} />
          <RegistrationTable rows={shown} />
        </>
      )}
    </Stack>
  );
}
