import { Box, Heading } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { mainContentId } from "@/components/ui/skip-link";
import type { PageContent, SiteSettings } from "@/lib/cms";

import { PageColumns } from "./PageColumns";
import { VerseHero } from "./VerseHero";

// The homepage: the church's verse over an open Bible with a welcome, then
// the home page's own text (its title as the first section heading).
export function HomePage({ page, settings }: { page: PageContent; settings: SiteSettings }) {
  const t = useTranslations("site");
  return (
    <Box as="main" id={mainContentId} tabIndex={-1}>
      <VerseHero verse={settings.tagline} welcome={t("welcome")} />
      <PageColumns
        heading={
          <Heading as="h2" size="3xl" textWrap="balance">
            {page.title}
          </Heading>
        }
        page={page}
        settings={settings}
      />
    </Box>
  );
}
