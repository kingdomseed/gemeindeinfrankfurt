import { Field, Span } from "@chakra-ui/react";
import type { ReactNode } from "react";

// Label, optional marker, help text and error around one input.
export function FormField(props: {
  label: string;
  optionalLabel?: string | undefined;
  help?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  children: ReactNode;
}) {
  return (
    <Field.Root
      required={props.required}
      disabled={props.disabled}
      invalid={Boolean(props.error)}
      gap="1"
    >
      <Field.Label fontSize="md" fontWeight="normal">
        {props.label}
        {props.optionalLabel && (
          <Span fontSize="sm" color="fg.muted">
            ({props.optionalLabel})
          </Span>
        )}
      </Field.Label>
      {props.help && <Field.HelperText mt="0">{props.help}</Field.HelperText>}
      {props.children}
      {props.error && <Field.ErrorText>{props.error}</Field.ErrorText>}
    </Field.Root>
  );
}
