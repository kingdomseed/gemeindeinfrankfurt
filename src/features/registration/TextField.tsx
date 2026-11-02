import { Input } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { FormField } from "@/components/ui/form-field";

// An uncontrolled text input with its label, for the registration form.
export function TextField(props: {
  name: string;
  label: string;
  value?: string | undefined;
  type?: "text" | "email" | "tel";
  optional?: boolean;
  help?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean | undefined;
}) {
  const t = useTranslations("register");
  return (
    <FormField
      label={props.label}
      optionalLabel={props.optional ? t("optional") : undefined}
      help={props.help}
      required={props.required}
      disabled={props.disabled}
    >
      <Input
        name={props.name}
        type={props.type ?? "text"}
        defaultValue={props.value}
        autoComplete={props.autoComplete}
        bg="bg"
      />
    </FormField>
  );
}
