import { Box } from "@chakra-ui/react";

import { PageHeading } from "@/components/ui/page-heading";
import { mainContentId } from "@/components/ui/skip-link";
import type { PageContent, SiteSettings } from "@/lib/cms";

import { HeaderPhoto } from "./HeaderPhoto";
import { PageColumns } from "./PageColumns";

// A public church page: the header photo, then the page text and contact panel.
export function ChurchPage(props: { slug: string; page: PageContent; settings: SiteSettings }) {
  const { page, settings } = props;
  return (
    <Box as="main" id={mainContentId} tabIndex={-1}>
      <HeaderPhoto slug={props.slug} />
      <PageColumns heading={<PageHeading title={page.title} />} page={page} settings={settings} />
    </Box>
  );
}
