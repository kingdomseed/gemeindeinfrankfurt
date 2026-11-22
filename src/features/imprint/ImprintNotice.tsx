import { Link, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { PageHeading } from "@/components/ui/page-heading";
import { TitledSection } from "@/components/ui/titled-section";

// The legal notice German law requires of a public website: who runs it, a
// postal address, and who is responsible for its content.
export function ImprintNotice({
  siteName,
  address,
  responsible,
  email,
}: {
  siteName: string;
  address: string;
  responsible: string | null;
  email: string | null;
}) {
  const t = useTranslations("imprint");
  return (
    <Stack as="article" maxW="prose" gap="8">
      <PageHeading title={t("title")} />
      <TitledSection title={t("providerTitle")}>
        <Text>{siteName}</Text>
        <Text>{address}</Text>
        {responsible && <Text>{t("representedBy", { name: responsible })}</Text>}
      </TitledSection>
      {email && (
        <TitledSection title={t("contactTitle")}>
          <Text>
            {t("email")}{" "}
            <Link href={`mailto:${email}`} textDecoration="underline" color="inherit">
              {email}
            </Link>
          </Text>
        </TitledSection>
      )}
      {responsible && (
        <TitledSection title={t("contentTitle")}>
          <Text>{responsible}</Text>
          <Text>{address}</Text>
        </TitledSection>
      )}
    </Stack>
  );
}
