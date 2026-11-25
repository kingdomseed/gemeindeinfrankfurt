import { Field, Span } from "@chakra-ui/react";
import type { ReactNode } from "react";

// Label, optional marker and help text around one input.
export function FormField(props: {
  label: string;
  optionalLabel?: string | undefined;
  help?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  children: ReactNode;
}) {
  return (
    <Field.Root required={props.required} disabled={props.disabled} gap="1">
      <Field.Label fontSize="md" fontWeight="normal">
        {props.label}
        {props.optionalLabel && (
          <Span fontSize="sm" color="fg.muted">
            ({props.optionalLabel})
          </Span>
        )}
      </Field.Label>
      {props.children}
      {props.help && <Field.HelperText>{props.help}</Field.HelperText>}
    </Field.Root>
  );
}
