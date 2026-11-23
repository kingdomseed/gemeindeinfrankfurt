import { Box, Button, Container, Flex, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { mainContentId } from "@/components/ui/skip-link";
import { SiteNav } from "@/features/shell/SiteNav";

import { coordinatorSections } from "./sections";

// The coordinators' workspace: which training, sign out, and the links
// between its pages, above a wider column than the registrant's pages.
// Printing leaves only the page itself, such as name tags.
export function CoordinatorShell(props: {
  trainingTitle: string | null;
  signOut: () => Promise<void>;
  children: ReactNode;
}) {
  const t = useTranslations("coordinator");
  return (
    <>
      <Box borderBottomWidth="1px" borderColor="border" _print={{ display: "none" }}>
        <Container maxW="6xl" px="4">
          <Flex wrap="wrap" align="center" justify="space-between" columnGap="4" pt="3">
            <Text fontSize="sm" color="fg.muted">
              <Text as="span" fontWeight="semibold" color="fg">
                {t("title")}
              </Text>
              {props.trainingTitle && ` · ${props.trainingTitle}`}
            </Text>
            <form action={props.signOut}>
              <Button type="submit" variant="ghost" size="sm" color="fg">
                {t("signOut")}
              </Button>
            </form>
          </Flex>
          <SiteNav
            label={t("nav.label")}
            items={coordinatorSections.map((s) => ({
              href: s.href,
              label: t(`nav.${s.key}`),
              exact: s.key === "overview",
            }))}
          />
        </Container>
      </Box>
      <Container
        as="main"
        id={mainContentId}
        tabIndex={-1}
        maxW="6xl"
        px="4"
        pt="6"
        pb="16"
        _print={{ p: "0", maxW: "none" }}
      >
        {props.children}
      </Container>
    </>
  );
}
