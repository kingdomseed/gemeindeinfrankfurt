import { Box, Stack, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import type { PageTeaser } from "@/lib/cms";
import { fromCapitals } from "@/lib/domain/rich-text";

import { Eyebrow } from "./Eyebrow";
import { PhotoBand } from "./PhotoBand";
import { homeBelief, homeVisitors } from "./photos";
import { ReadMoreLink } from "./ReadMoreLink";
import { SectionHeading } from "./SectionHeading";

// Another page on the homepage: its first statements (Unser Glaube), or its
// opening paragraph under the welcome (Für Besucher), and a link to it.
export function TeaserBand(props: { teaser: PageTeaser; index: number }) {
  const t = useTranslations("site");
  const locale = useLocale();
  const { teaser } = props;
  const headingId = `teaser-${props.index}`;
  const [first, ...more] = teaser.statements;
  const tinted = props.index % 2 === 0;
  return (
    <PhotoBand
      photo={first ? homeBelief : homeVisitors}
      tinted={tinted}
      photoEnd={props.index % 2 === 1}
      labelledBy={headingId}
      loading={props.index === 0 ? "eager" : "lazy"}
    >
      <Eyebrow>{teaser.title}</Eyebrow>
      {first ? (
        <>
          <SectionHeading id={headingId}>
            {fromCapitals(first.heading, locale !== "ru")}
          </SectionHeading>
          <Text color="fg.muted" maxW="60ch">
            {first.text} {first.references}
          </Text>
          <Stack as="ul" listStyleType="none" gap="3" w="full">
            {more.slice(0, 2).map((item) => (
              <Box
                as="li"
                key={item.id}
                bg={tinted ? "bg" : "bg.subtle"}
                rounded="l3"
                px="5"
                py="4"
              >
                <Text fontSize="xs" fontWeight="bold" letterSpacing="wider">
                  {item.heading}
                </Text>
                <Text fontSize="sm" color="fg.muted">
                  {item.text} {item.references}
                </Text>
              </Box>
            ))}
          </Stack>
        </>
      ) : (
        <>
          <SectionHeading id={headingId}>{t("welcome")}</SectionHeading>
          <Text color="fg.muted" maxW="60ch">
            {teaser.excerpt}
          </Text>
        </>
      )}
      <ReadMoreLink href={teaser.href} label={t("readMore")} describedBy={headingId} />
    </PhotoBand>
  );
}
