import { Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { MainColumn } from "@/features/shell/MainColumn";

export function LoginPage({ children }: { children: ReactNode }) {
  const t = useTranslations("coordinator");
  return (
    <MainColumn>
      <Card maxW="sm" mx="auto" mt={{ base: "2", md: "6" }} p={{ base: "6", sm: "8" }} gap="4">
        <PageHeading title={t("signIn")} />
        <Text color="fg.muted">{t("signInHelp")}</Text>
        {children}
      </Card>
    </MainColumn>
  );
}
