"use client";

import { Box, Button, chakra, Input, List, NativeSelect, Stack, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { FormField } from "@/components/ui/form-field";
import type { Service } from "@/lib/services";

type Action = (form: FormData) => Promise<void>;

// Each service with who leads it, saved as soon as a lead is picked; a
// service can be removed, and a new one added below.
export function ServiceList(props: {
  services: readonly Service[];
  // Coordinators and registrants, the people who can lead a service.
  people: readonly string[];
  actions: { setLead: Action; add: Action; remove: Action };
}) {
  const t = useTranslations("coordinator.services");
  const locale = useLocale();
  const known = new Set(props.people);
  return (
    <Stack gap="4">
      <List.Root listStyle="none" borderTopWidth="1px">
        {props.services.map((s) => {
          const name = s.kind ? t(`kinds.${s.kind}.name`) : s.name;
          const choices = s.lead && !known.has(s.lead) ? [s.lead, ...props.people] : props.people;
          return (
            <List.Item
              key={s.id}
              display="grid"
              gridTemplateColumns={{ base: "1fr", md: "minmax(0, 1fr) minmax(12rem, 15rem) auto" }}
              columnGap="4"
              rowGap="2"
              alignItems="center"
              py="2"
              borderBottomWidth="1px"
            >
              <Box minW="0">
                <Text>
                  {name}
                  {s.kind && locale !== "de" && (
                    <Text as="span" fontSize="sm" color="fg.muted" lang="de">
                      {` ${s.name}`}
                    </Text>
                  )}
                </Text>
                {s.kind && (
                  <Text fontSize="xs" color="fg.muted">
                    {t(`kinds.${s.kind}.what`)}
                  </Text>
                )}
              </Box>
              <form action={props.actions.setLead} key={s.lead}>
                <input type="hidden" name="id" value={s.id} />
                <NativeSelect.Root>
                  <NativeSelect.Field
                    name="lead"
                    defaultValue={s.lead}
                    aria-label={t("leadFor", { service: name })}
                    aria-invalid={s.lead === "" || undefined}
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                  >
                    <option value="">{t("noOne")}</option>
                    {choices.map((person) => (
                      <option key={person} value={person}>
                        {person}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </form>
              <form action={props.actions.remove}>
                <input type="hidden" name="id" value={s.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  color="fg"
                  aria-label={`${t("remove")}: ${name}`}
                >
                  {t("remove")}
                </Button>
              </form>
            </List.Item>
          );
        })}
      </List.Root>
      <chakra.form
        action={props.actions.add}
        key={props.services.length}
        display="flex"
        alignItems="flex-end"
        gap="3"
        flexWrap="wrap"
      >
        <Box flex="1 1 16rem">
          <FormField label={t("newService")}>
            <Input name="name" required maxLength={100} />
          </FormField>
        </Box>
        <Button type="submit" variant="outline" color="fg">
          {t("add")}
        </Button>
      </chakra.form>
    </Stack>
  );
}
