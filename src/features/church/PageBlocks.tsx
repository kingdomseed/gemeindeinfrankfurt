import { Box } from "@chakra-ui/react";

import { DisclosureList } from "@/components/ui/disclosure-list";
import type { PageBlock } from "@/lib/cms";

import { AnnouncementList } from "./AnnouncementList";
import { MeetingPlace } from "./MeetingPlace";
import { PageBody } from "./PageBody";
import { StatementGrid } from "./StatementGrid";

// Draws the sections of a CMS page, in the order the editor stacked them.
export function PageBlocks(props: {
  blocks: readonly PageBlock[];
  pageHrefs: Record<string, string>;
  meetingAddress: string;
}) {
  return props.blocks.map((block) => {
    if (block.type === "text") {
      return (
        <Box key={block.id} maxW="prose">
          <PageBody content={block.content} pageHrefs={props.pageHrefs} />
        </Box>
      );
    }
    if (block.type === "faq") {
      return (
        <DisclosureList
          key={block.id}
          items={block.items.map((item) => ({
            id: item.id,
            title: item.question,
            content: <PageBody content={item.answer} pageHrefs={props.pageHrefs} />,
          }))}
        />
      );
    }
    if (block.type === "statements") return <StatementGrid key={block.id} items={block.items} />;
    if (block.type === "meetingPlace") {
      return <MeetingPlace key={block.id} heading={block.heading} address={props.meetingAddress} />;
    }
    return (
      <AnnouncementList
        key={block.id}
        heading={block.heading}
        items={block.items}
        pageHrefs={props.pageHrefs}
      />
    );
  });
}
