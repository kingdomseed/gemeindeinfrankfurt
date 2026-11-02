import { Stack, Text } from "@chakra-ui/react";

import { PageHeading } from "./page-heading";

// The whole body of a page that has nothing else to show, such as "not open
// yet", "closed" or "link not valid": what happened, then what to do.
export function PageMessage(props: { title: string; body?: string }) {
  return (
    <Stack gap="4" mt="4">
      <PageHeading title={props.title} />
      {props.body && <Text>{props.body}</Text>}
    </Stack>
  );
}
