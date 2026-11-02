import { Fieldset } from "@chakra-ui/react";
import type { ReactNode } from "react";

// A titled group of form fields. Disabling it disables every input inside.
export function FormSection(props: {
  legend: string;
  disabled?: boolean | undefined;
  children: ReactNode;
}) {
  return (
    <Fieldset.Root disabled={props.disabled} minW="0" gap="3">
      <Fieldset.Legend fontSize="lg" fontWeight="semibold" color="fg" mb="3">
        {props.legend}
      </Fieldset.Legend>
      <Fieldset.Content mt="0">{props.children}</Fieldset.Content>
    </Fieldset.Root>
  );
}
