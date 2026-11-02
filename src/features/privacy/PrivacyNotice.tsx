import { Link, List, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { PageHeading } from "@/components/ui/page-heading";
import { TitledSection } from "@/components/ui/titled-section";
import type { Contact } from "@/lib/site";

const sections = [
  "data",
  "purpose",
  "basis",
  "recipients",
  "retention",
  "rights",
  "complaint",
] as const;

export function PrivacyNotice({ contacts }: { contacts: readonly Contact[] }) {
  const t = useTranslations("privacy");
  return (
    <Stack as="article" maxW="prose" gap="8">
      <Stack gap="3">
        <PageHeading title={t("title")} />
        <Text>{t("intro")}</Text>
      </Stack>
      <TitledSection title={t("controllerTitle")}>
        {contacts.length > 0 ? (
          <>
            <List.Root listStyle="none">
              {contacts.map((c) => (
                <List.Item key={c.email}>
                  {c.name},{" "}
                  <Link href={`mailto:${c.email}`} textDecoration="underline" color="inherit">
                    {c.email}
                  </Link>
                </List.Item>
              ))}
            </List.Root>
            <Text>{t("controllerBody")}</Text>
          </>
        ) : (
          <Text>{t("noContact")}</Text>
        )}
      </TitledSection>
      {sections.map((s) => (
        <TitledSection key={s} title={t(`${s}Title`)}>
          <Text>{t(`${s}Body`)}</Text>
        </TitledSection>
      ))}
    </Stack>
  );
}
