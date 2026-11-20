import { Input, SimpleGrid, Stack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { CheckboxChoice } from "@/components/ui/choice";
import { FormField } from "@/components/ui/form-field";

// One payment in the payment form: the received tick, the day it arrived and
// the bank's transaction number. `name` is "fee" or "outline".
export function PaymentFields(props: {
  name: "fee" | "outline";
  label: string;
  paid: boolean;
  paidOn: string | null;
  transaction: string;
}) {
  const t = useTranslations("coordinator");
  return (
    <Stack gap="1">
      <CheckboxChoice name={`${props.name}_paid`} defaultChecked={props.paid}>
        {props.label}
      </CheckboxChoice>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap="3" ps={{ sm: "8" }}>
        <FormField label={t("dateReceived")}>
          <Input name={`${props.name}_paid_on`} type="date" defaultValue={props.paidOn ?? ""} />
        </FormField>
        <FormField label={t("transaction")} optionalLabel={t("optional")}>
          <Input
            name={`${props.name}_transaction`}
            defaultValue={props.transaction}
            maxLength={100}
            autoComplete="off"
          />
        </FormField>
      </SimpleGrid>
    </Stack>
  );
}
