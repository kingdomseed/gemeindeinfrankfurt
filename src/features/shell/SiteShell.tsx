import { Container } from "@chakra-ui/react";
import type { ReactNode } from "react";

import type { Contact } from "@/lib/site";

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

// Header, main column and footer shared by every page.
export function SiteShell({
  contacts,
  children,
}: {
  contacts: readonly Contact[];
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <Container as="main" maxW="3xl" px="4" pt="6" pb="16">
        {children}
      </Container>
      <SiteFooter contacts={contacts} />
    </>
  );
}
