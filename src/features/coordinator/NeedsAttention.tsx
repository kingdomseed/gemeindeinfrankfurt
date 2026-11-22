import { Button, Flex, Heading, List, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { Link as LocaleLink } from "@/i18n/navigation";

import { sectionHref, registrationsHref } from "./sections";
import type { Summary } from "./summary";

type Item = { key: string; text: string; action: string; href: string };

// Open tasks the numbers point to, each with a link to where it is done.
export function NeedsAttention({ summary }: { summary: Summary }) {
  const t = useTranslations("coordinator");
  const tl = useTranslations("common.languages");
  const firstDuplicate = summary.active.find((r) => summary.duplicates.has(r.registration.id));
  const items: Item[] = [
    ...(summary.counts.unpaidRegistrations > 0
      ? [
          {
            key: "unpaid",
            text: t("attention.unpaid", { count: summary.counts.unpaidRegistrations }),
            action: t("attention.show"),
            href: registrationsHref({ show: "unpaid" }),
          },
        ]
      : []),
    ...(firstDuplicate
      ? [
          {
            key: "duplicates",
            text: t("attention.duplicates", { count: summary.duplicates.size }),
            action: t("attention.review"),
            href: registrationsHref({ q: firstDuplicate.registration.email }),
          },
        ]
      : []),
    ...summary.stock
      .filter((s) => s.extra < 0)
      .map((s) => ({
        key: `outlines-${s.language}`,
        text: t("attention.outlinesShort", {
          language: tl(s.language),
          ordered: s.ordered,
          needed: s.needed,
        }),
        action: t("attention.updateOrder"),
        href: sectionHref("outlines"),
      })),
  ];
  return (
    <Stack as="section" aria-labelledby="attention-heading" gap="3">
      <Heading as="h2" id="attention-heading" size="xl">
        {t("attention.title")}
      </Heading>
      {items.length === 0 ? (
        <Text color="fg.muted">{t("attention.none")}</Text>
      ) : (
        <List.Root listStyle="none" borderTopWidth="1px">
          {items.map((item) => (
            <List.Item key={item.key} display="block" py="2" borderBottomWidth="1px">
              <Flex wrap="wrap" align="center" justify="space-between" columnGap="4" rowGap="2">
                <Text fontVariantNumeric="tabular-nums">{item.text}</Text>
                <Button asChild size="xs" variant="outline" color="fg">
                  <LocaleLink href={item.href}>{item.action}</LocaleLink>
                </Button>
              </Flex>
            </List.Item>
          ))}
        </List.Root>
      )}
    </Stack>
  );
}
