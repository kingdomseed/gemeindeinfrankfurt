import { Container, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { mainContentId } from "@/components/ui/skip-link";

export function LoginPage({ children }: { children: ReactNode }) {
  const t = useTranslations("coordinator");
  return (
    <Container
      as="main"
      id={mainContentId}
      tabIndex={-1}
      maxW="6xl"
      px="4"
      py={{ base: "10", md: "16" }}
    >
      <Card maxW="sm" mx="auto" p={{ base: "6", sm: "8" }} gap="4">
        <PageHeading title={t("signIn")} />
        <Text color="fg.muted">{t("signInHelp")}</Text>
        {children}
      </Card>
    </Container>
  );
}
