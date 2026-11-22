import { Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { RadioChoices } from "@/components/ui/choice";
import { FormSection } from "@/components/ui/form-section";
import { formatEuro } from "@/lib/domain/fees";
import { seatTypes, type SeatType } from "@/lib/domain/types";

import { useRegistrationForm } from "./RegistrationFormContext";

export function SeatSection() {
  const t = useTranslations("register");
  const locale = useLocale();
  const { state, actions, meta } = useRegistrationForm();
  // Shared and Anaheim seats carry their own rule under the label.
  function help(s: SeatType) {
    if (s === "shared") return t("seatHelp.shared");
    if (s === "anaheim") return t("seatHelp.anaheim");
    return undefined;
  }
  return (
    <FormSection legend={t("seatType")} disabled={meta.locked}>
      <Text mb="2">{t("seatRules", { fee: formatEuro(meta.feeCents, locale) })}</Text>
      <RadioChoices
        name="seat_type"
        value={state.seatType}
        disabled={meta.locked}
        onChange={actions.setSeatType}
        options={seatTypes.map((s) => ({
          value: s,
          label: t(`seat.${s}`),
          description: help(s),
        }))}
      />
    </FormSection>
  );
}
