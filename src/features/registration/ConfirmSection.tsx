import { List, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { CheckboxChoice } from "@/components/ui/choice";
import { FormSection } from "@/components/ui/form-section";

import { useRegistrationForm } from "./RegistrationFormContext";

const attendRules = ["seat", "nameTag", "absences", "testing", "leaving"] as const;

// The attendance and training-material rules, word for word from the
// training's rules, and the two confirmations Lebensstrom requires.
export function ConfirmRules(props: { confirmed: boolean }) {
  const t = useTranslations("register");
  return (
    <FormSection legend={t("sectionConfirm")}>
      <Card>
        <Text fontWeight="medium">{t("rulesIntro")}</Text>
        <List.Root ps="5" gap="2">
          {attendRules.map((key) => (
            <List.Item key={key}>{t(`attendRules.${key}`)}</List.Item>
          ))}
        </List.Root>
        <Text fontWeight="medium" mt="2">
          {t("materialsTitle")}
        </Text>
        <List.Root ps="5" gap="2">
          <List.Item>{t("materialsRule")}</List.Item>
          <List.Item>{t("copiesRule")}</List.Item>
        </List.Root>
      </Card>
      <Stack gap="1">
        <CheckboxChoice name="confirmed_adult" required defaultChecked={props.confirmed}>
          {t("confirmAdult")}
          <Text as="span" display="block" mt="0.5" fontSize="sm" color="fg.muted">
            {t("confirmAdultHelp")}
          </Text>
        </CheckboxChoice>
        <CheckboxChoice name="accepted_rules" required defaultChecked={props.confirmed}>
          {t("acceptRules")}
        </CheckboxChoice>
      </Stack>
    </FormSection>
  );
}

export function ConfirmSection() {
  // A stored registration has already confirmed both.
  const confirmed = Boolean(useRegistrationForm().meta.defaults);
  return <ConfirmRules confirmed={confirmed} />;
}
