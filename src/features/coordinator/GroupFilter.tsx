import { Button, ButtonGroup, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { Link as LocaleLink } from "@/i18n/navigation";

// "All, 1, 2, 3 …": shows one study group at a time.
export function GroupFilter(props: {
  groups: readonly number[];
  current: number | null;
  href: (group: number | null) => string;
}) {
  const t = useTranslations("coordinator.attendance");
  if (props.groups.length === 0) return null;
  const choices = [null, ...props.groups];
  return (
    <Stack gap="1">
      <Text id="group-filter" fontSize="sm">
        {t("group")}
      </Text>
      <ButtonGroup as="nav" attached size="sm" variant="outline" aria-labelledby="group-filter">
        {choices.map((g) => (
          <Button
            key={g ?? "all"}
            asChild
            variant={props.current === g ? "solid" : "outline"}
            color={props.current === g ? undefined : "fg"}
            minW="11"
          >
            <LocaleLink
              href={props.href(g)}
              aria-current={props.current === g ? "page" : undefined}
            >
              {g === null ? t("all") : String(g)}
            </LocaleLink>
          </Button>
        ))}
      </ButtonGroup>
    </Stack>
  );
}
