import { Container } from "@chakra-ui/react";
import type { ReactNode } from "react";

// The narrow <main> column of the training pages and the privacy notice.
export function MainColumn({ children }: { children: ReactNode }) {
  return (
    <Container as="main" maxW="3xl" px="4" pt="6" pb="16">
      {children}
    </Container>
  );
}
