import { NativeSelect } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { FormField } from "./form-field";

// A labelled native select. `field` takes the <select> props (name, value,
// defaultValue, onChange); the options are the children.
export function SelectField(props: {
  label: string;
  required?: boolean | undefined;
  children: ReactNode;
  field: Parameters<typeof NativeSelect.Field>[0];
}) {
  return (
    <FormField label={props.label} required={props.required}>
      <NativeSelect.Root>
        <NativeSelect.Field {...props.field}>{props.children}</NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </FormField>
  );
}
