import { Container, Link, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import type { Contact } from "@/lib/site";

// "Questions?" and the training coordinators to write to, under the training pages.
export function TrainingContacts({ contacts }: { contacts: readonly Contact[] }) {
  const t = useTranslations("common");
  if (contacts.length === 0) return null;
  return (
    <Container maxW="3xl" px="4" pb="8">
      <Text fontSize="sm" color="fg.muted">
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
    </Container>
  );
}
