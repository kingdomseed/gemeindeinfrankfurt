import { Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { CheckboxChoice } from "@/components/ui/choice";
import { FormSection } from "@/components/ui/form-section";

export function FreeSeatSection(props: {
  anaheim: boolean;
  ukraine: boolean;
  onAnaheim: (v: boolean) => void;
  onUkraine: (v: boolean) => void;
}) {
  const t = useTranslations("register");
  return (
    <FormSection legend={t("sectionFreeSeat")}>
      <Text fontSize="sm" color="fg.muted">
        {t("freeSeatHelp")}
      </Text>
      <Stack gap="1">
        <CheckboxChoice
          name="attended_anaheim"
          checked={props.anaheim}
          onCheckedChange={props.onAnaheim}
        >
          {t("attendedAnaheim")}
        </CheckboxChoice>
        <CheckboxChoice
          name="ukraine_not_employed"
          checked={props.ukraine}
          onCheckedChange={props.onUkraine}
        >
          {t("ukraineNotEmployed")}
        </CheckboxChoice>
      </Stack>
    </FormSection>
  );
}
