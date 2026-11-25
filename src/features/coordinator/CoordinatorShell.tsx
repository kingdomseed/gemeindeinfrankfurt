import { Box, Button, Container, Flex, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { mainContentId } from "@/components/ui/skip-link";
import { SiteNav } from "@/features/shell/SiteNav";
import type { SpaceLink } from "@/lib/links";

import { PresenceBar } from "./PresenceBar";
import { coordinatorSections } from "./sections";
import { SpaceLinksBar } from "./SpaceLinksBar";
import type { FormAction } from "./types";

// The coordinators' workspace: which training, live presence, shared space
// links, sign out, and the links between its pages. Printing leaves only the
// page itself, such as name tags.
export function CoordinatorShell(props: {
  trainingTitle: string | null;
  links: readonly SpaceLink[];
  addLink: FormAction | null;
  removeLink: (form: FormData) => Promise<void>;
  signOut: () => Promise<void>;
  children: ReactNode;
}) {
  const t = useTranslations("coordinator");
  return (
    <>
      <Box borderBottomWidth="1px" borderColor="border" _print={{ display: "none" }}>
        <Container maxW="6xl">
          <Flex wrap="wrap" align="center" justify="space-between" columnGap="4" rowGap="2" pt="3">
            <Flex wrap="wrap" align="center" gap="3">
              <Text fontSize="sm" color="fg.muted">
                <Text as="span" fontWeight="semibold" color="fg">
                  {t("title")}
                </Text>
                {props.trainingTitle && ` · ${props.trainingTitle}`}
              </Text>
              <PresenceBar />
            </Flex>
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
        pt="6"
        pb="16"
        _print={{ p: "0", maxW: "none" }}
      >
        {props.addLink && (
          <SpaceLinksBar
            links={props.links}
            addLink={props.addLink}
            removeLink={props.removeLink}
          />
        )}
        {props.children}
      </Container>
    </>
  );
}
