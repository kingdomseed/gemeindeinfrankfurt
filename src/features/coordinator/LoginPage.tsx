import { Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { PageHeading } from "@/components/ui/page-heading";

export function LoginPage({ children }: { children: ReactNode }) {
  const t = useTranslations("coordinator");
  return (
    <Stack mt="10" maxW="sm" gap="4">
      <PageHeading title={t("signIn")} />
      <Text color="fg.muted">{t("signInHelp")}</Text>
      {children}
    </Stack>
  );
}
