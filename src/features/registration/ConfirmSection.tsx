import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { CheckboxChoice } from "@/components/ui/choice";
import { FormSection } from "@/components/ui/form-section";

export function ConfirmSection(props: { rules: string; confirmed: boolean }) {
  const t = useTranslations("register");
  return (
    <FormSection legend={t("sectionConfirm")}>
      {props.rules && (
        <Box borderWidth="1px" rounded="lg" p="4">
          <Heading as="h3" size="md" fontWeight="semibold">
            {t("rules")}
          </Heading>
          <Text mt="1" fontSize="sm" whiteSpace="pre-line">
            {props.rules}
          </Text>
        </Box>
      )}
      <Stack gap="1">
        <CheckboxChoice name="confirmed_adult" required defaultChecked={props.confirmed}>
          {t("confirmAdult")}
        </CheckboxChoice>
        <CheckboxChoice name="accepted_rules" required defaultChecked={props.confirmed}>
          {t("acceptRules")}
        </CheckboxChoice>
      </Stack>
    </FormSection>
  );
}
