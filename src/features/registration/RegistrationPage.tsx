import { Stack } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { Notice } from "@/components/ui/notice";
import { PageHeading } from "@/components/ui/page-heading";

// Page frame for registering and editing: heading, optional notice, the form.
export function RegistrationPage(props: {
  title: string;
  subtitle?: string | undefined;
  lockedNotice?: string | undefined;
  children: ReactNode;
}) {
  return (
    <Stack gap="8">
      <PageHeading title={props.title} subtitle={props.subtitle} />
      {props.lockedNotice && <Notice tone="warning">{props.lockedNotice}</Notice>}
      {props.children}
    </Stack>
  );
}
