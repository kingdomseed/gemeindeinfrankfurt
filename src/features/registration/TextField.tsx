import { Input } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { FormField } from "@/components/ui/form-field";

// An uncontrolled text input with its label, for the registration form.
export function TextField(props: {
  name: string;
  label: string;
  value: string | undefined;
  autoComplete: string;
  type?: "email" | "tel";
  // Phone is the one field a person may leave empty; every other one is required.
  optional?: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("register");
  return (
    <FormField
      label={props.label}
      optionalLabel={props.optional ? t("optional") : undefined}
      required={!props.optional}
      disabled={props.disabled}
    >
      <Input
        name={props.name}
        type={props.type ?? "text"}
        defaultValue={props.value}
        autoComplete={props.autoComplete}
      />
    </FormField>
  );
}
