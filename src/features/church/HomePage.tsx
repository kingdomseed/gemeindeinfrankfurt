import { Box, Container, Stack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { mainContentId } from "@/components/ui/skip-link";
import type { PageContent, PageTeaser, SiteSettings } from "@/lib/cms";
import { firstParagraph, withoutFirstParagraph } from "@/lib/domain/rich-text";

import { ContactBox } from "./ContactBox";
import { HomeHero } from "./HomeHero";
import { HomeIntro } from "./HomeIntro";
import { PageBlocks } from "./PageBlocks";
import { PlaceBand } from "./PlaceBand";
import { TeaserBand } from "./TeaserBand";

// The homepage: hero, the church's own introduction, the home page's other
// sections (such as events and announcements), a band for each other page,
// the meeting place and an invitation to write.
export function HomePage(props: {
  page: PageContent;
  teasers: readonly PageTeaser[];
  settings: SiteSettings;
}) {
  const t = useTranslations("site");
  const { page, settings, teasers } = props;
  const intro = page.blocks.find((block) => block.type === "text");
  const others = page.blocks.flatMap((block) => {
    if (block.type === "meetingPlace") return [];
    if (block !== intro) return [block];
    const content = withoutFirstParagraph(block.content);
    return content ? [{ ...block, content }] : [];
  });
  const visitors = teasers.find((teaser) => teaser.statements.length === 0);
  return (
    <Box as="main" id={mainContentId} tabIndex={-1}>
      <HomeHero
        verse={settings.tagline}
        welcome={t("welcome")}
        action={visitors ? { href: visitors.href, label: t("visitUs") } : null}
      />
      <HomeIntro title={page.title} text={firstParagraph(intro?.content ?? page.body)} />
      {others.length > 0 && (
        <Container maxW="6xl" px="4" pb={{ base: "14", md: "22" }}>
          <Stack gap="10">
            <PageBlocks
              blocks={others}
              pageHrefs={page.pageHrefs}
              meetingAddress={settings.meetingAddress}
            />
          </Stack>
        </Container>
      )}
      {teasers.map((teaser, index) => (
        <TeaserBand key={teaser.href} teaser={teaser} index={index} />
      ))}
      <PlaceBand address={settings.meetingAddress} tinted={teasers.length % 2 === 0} />
      <ContactBox settings={settings} />
    </Box>
  );
}
