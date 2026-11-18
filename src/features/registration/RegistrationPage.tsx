import { Span, Stack } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { Notice } from "@/components/ui/notice";
import { PageHeading } from "@/components/ui/page-heading";

// Page frame for registering and editing: heading with the training's dates,
// optional notice, the form.
export function RegistrationPage(props: {
  title: string;
  dates?: string | undefined;
  subtitle?: string | undefined;
  lockedNotice?: string | undefined;
  // Shown under the heading, such as the add-to-calendar buttons.
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Stack gap="8">
      <PageHeading
        title={props.title}
        subtitle={
          props.dates ? (
            <Span fontWeight="semibold" color="brand.solid">
              {props.dates}
            </Span>
          ) : (
            props.subtitle
          )
        }
      />
      {props.aside}
      {props.lockedNotice && <Notice tone="neutral">{props.lockedNotice}</Notice>}
      {props.children}
    </Stack>
  );
}
