import { Heading, Link, List, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { PageHeading } from "@/components/ui/page-heading";
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack as="section" gap="1">
      <Heading as="h2" size="xl" fontWeight="semibold">
        {title}
      </Heading>
      {children}
    </Stack>
  );
}

export function PrivacyNotice({ contacts }: { contacts: readonly Contact[] }) {
  const t = useTranslations("privacy");
  return (
    <Stack as="article" maxW="prose" gap="8">
      <Stack gap="3">
        <PageHeading title={t("title")} />
        <Text>{t("intro")}</Text>
      </Stack>
      <Section title={t("controllerTitle")}>
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
      </Section>
      {sections.map((s) => (
        <Section key={s} title={t(`${s}Title`)}>
          <Text>{t(`${s}Body`)}</Text>
        </Section>
      ))}
    </Stack>
  );
}
