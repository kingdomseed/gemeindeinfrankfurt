import { Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

import type { RegistrationDetail } from "@/lib/coordinator";

import { RegistrationHeading } from "./RegistrationHeading";

// One registration's page for coordinators: the heading, then whatever the
// route composes under it.
export function RegistrationDetailPage(props: {
  registration: RegistrationDetail["registration"];
  note?: string;
  children: ReactNode;
}) {
  return (
    <Stack gap="10">
      <Stack gap="3">
        <RegistrationHeading registration={props.registration} />
        {props.note && <Text color="fg.muted">{props.note}</Text>}
      </Stack>
      {props.children}
    </Stack>
  );
}
