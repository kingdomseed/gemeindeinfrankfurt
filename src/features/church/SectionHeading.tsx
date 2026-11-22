import { Heading } from "@chakra-ui/react";
import type { ReactNode } from "react";

// A homepage section's heading in the serif.
export function SectionHeading(props: { id?: string; children: ReactNode }) {
  return (
    <Heading
      as="h2"
      id={props.id}
      fontFamily="heading"
      fontWeight="semibold"
      fontSize={{ base: "3xl", md: "4xl" }}
      lineHeight="1.15"
      textWrap="balance"
    >
      {props.children}
    </Heading>
  );
}
