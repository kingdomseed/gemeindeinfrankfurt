import { Box, Button, Container, Flex, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { mainContentId } from "@/components/ui/skip-link";
import { SiteNav } from "@/features/shell/SiteNav";
import type { SectionKey } from "@/lib/domain/links";
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
  allowedSections: readonly SectionKey[];
  links: readonly SpaceLink[];
  addLink: FormAction | null;
  removeLink: (form: FormData) => Promise<void>;
  signOut: () => Promise<void>;
  children: ReactNode;
}) {
  const t = useTranslations("coordinator");
  const allowed = new Set(props.allowedSections);
  const visibleSections = coordinatorSections.filter((s) => allowed.has(s.key));
  return (
    <>
      <Box borderBottomWidth="1px" borderColor="border" _print={{ display: "none" }}>
        <Container maxW="6xl">
          <Flex align="center" justify="space-between" gap="3" pt={{ base: "2", md: "3" }} pb="1">
            <Text fontSize="sm" color="fg.muted" minW="0" truncate>
              <Text as="span" fontWeight="semibold" color="fg">
                {t("title")}
              </Text>
              {props.trainingTitle && ` · ${props.trainingTitle}`}
            </Text>
            <form action={props.signOut}>
              <Button
                type="submit"
                variant="ghost"
                size={{ base: "xs", md: "sm" }}
                color="fg.muted"
                _hover={{ color: "fg", bg: "bg.subtle" }}
                px="2"
                me="-2"
                minH="10"
                flexShrink={0}
                touchAction="manipulation"
                userSelect="none"
              >
                {t("signOut")}
              </Button>
            </form>
          </Flex>
          <PresenceBar />
          {visibleSections.length > 0 && (
            <SiteNav
              label={t("nav.label")}
              items={visibleSections.map((s) => ({
                href: s.href,
                label: t(`nav.${s.key}`),
                exact: s.key === "overview",
              }))}
            />
          )}
        </Container>
      </Box>
      <Container
        as="main"
        id={mainContentId}
        tabIndex={-1}
        maxW="6xl"
        pt={{ base: "4", md: "6" }}
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
