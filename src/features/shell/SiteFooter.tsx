import { Container, Flex, Link, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { Link as LocaleLink } from "@/i18n/navigation";
import type { Contact } from "@/lib/site";

export function SiteFooter({ contacts }: { contacts: readonly Contact[] }) {
  const t = useTranslations("common");
  return (
    <Container as="footer" maxW="3xl" px="4" py="6" borderTopWidth="1px">
      <Flex wrap="wrap" columnGap="6" rowGap="1" fontSize="sm" color="fg.muted">
        {contacts.length > 0 && (
          <Text>
            {t("questions")}{" "}
            {contacts.map((c, i) => (
              <span key={c.email}>
                {i > 0 && ", "}
                <Link href={`mailto:${c.email}`} color="inherit" textDecoration="underline">
                  {c.name}
                </Link>
              </span>
            ))}
          </Text>
        )}
        <Link asChild color="inherit" textDecoration="underline">
          <LocaleLink href="/privacy">{t("privacy")}</LocaleLink>
        </Link>
      </Flex>
    </Container>
  );
}
