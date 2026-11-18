import { Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { RadioChoices } from "@/components/ui/choice";
import { FormSection } from "@/components/ui/form-section";
import { seatTypes, type SeatType } from "@/lib/domain/types";

export function SeatSection(props: {
  value: SeatType;
  fee: string;
  onChange: (s: SeatType) => void;
  locked?: boolean | undefined;
}) {
  const t = useTranslations("register");
  // Shared and Anaheim seats carry their own rule under the label.
  function help(s: SeatType) {
    if (s === "shared") return t("seatHelp.shared");
    if (s === "anaheim") return t("seatHelp.anaheim");
    return undefined;
  }
  return (
    <FormSection legend={t("seatType")} disabled={props.locked}>
      <Text mb="2" fontSize="sm" color="fg.muted">
        {t("seatRules", { fee: props.fee })}
      </Text>
      <RadioChoices
        name="seat_type"
        value={props.value}
        disabled={props.locked}
        onChange={props.onChange}
        options={seatTypes.map((s) => ({
          value: s,
          label: t(`seat.${s}`),
          description: help(s),
        }))}
      />
    </FormSection>
  );
}
