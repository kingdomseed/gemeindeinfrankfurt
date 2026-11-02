import { useTranslations } from "next-intl";

import { RadioChoices } from "@/components/ui/choice";
import { FormSection } from "@/components/ui/form-section";
import { seatTypes, type SeatType } from "@/lib/domain/types";

export function SeatSection(props: {
  value: SeatType;
  onChange: (s: SeatType) => void;
  locked?: boolean | undefined;
}) {
  const t = useTranslations("register");
  return (
    <FormSection legend={t("seatType")} disabled={props.locked}>
      <RadioChoices
        name="seat_type"
        value={props.value}
        disabled={props.locked}
        onChange={props.onChange}
        options={seatTypes.map((s) => ({ value: s, label: t(`seat.${s}`) }))}
      />
    </FormSection>
  );
}
