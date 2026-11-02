import { Heading, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

// The h1 of a page, with an optional muted line under it.
export function PageHeading(props: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <Stack gap="1">
      <Heading as="h1" size="3xl" letterSpacing="tight" textWrap="balance">
        {props.title}
      </Heading>
      {props.subtitle && (
        <Text fontSize="lg" color="fg.muted">
          {props.subtitle}
        </Text>
      )}
    </Stack>
  );
}
