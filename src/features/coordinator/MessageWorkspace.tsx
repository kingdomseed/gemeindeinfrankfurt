import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { PageHeading } from "@/components/ui/page-heading";
import { Link as LocaleLink } from "@/i18n/navigation";
import type { Hymn, Verse } from "@/lib/domain/messages";

import { HymnsForm } from "./HymnsForm";
import { HymnTable } from "./HymnTable";
import { MessageEditor } from "./MessageEditor";
import { MessageList, type MessageListItem } from "./MessageList";
import { MessageSection } from "./MessageSection";
import { screenHref } from "./sections";
import type { FormAction } from "./types";
import { VerseList } from "./VerseList";
import { VersesForm } from "./VersesForm";

// The Messages page: every message beside one message's hymns and verses,
// read only until someone presses Edit.
export function MessageWorkspace(props: {
  messages: readonly MessageListItem[];
  message: { sessionId: string; number: number; when: string; hymns: Hymn[]; verses: Verse[] };
  actions: { saveHymns: FormAction; saveVerses: FormAction };
}) {
  const t = useTranslations("coordinator.messages");
  const { message } = props;
  const screen = screenHref(message.number);
  return (
    <Stack gap="8">
      <Flex justify="space-between" align="flex-end" gap="4" wrap="wrap">
        <PageHeading title={t("title")} subtitle={t("lead")} />
        <Button asChild>
          <LocaleLink href={screen}>{t("openOnScreen")}</LocaleLink>
        </Button>
      </Flex>
      <Flex wrap="wrap" gap="8" align="flex-start">
        <Box as="nav" aria-label={t("listLabel")} flex="1 1 13.75rem" maxW={{ md: "17.5rem" }}>
          <MessageList current={message.number} messages={props.messages} />
        </Box>
        <Stack flex="999 1 35rem" minW="0" gap="10">
          <Stack gap="1">
            <Heading as="h2" size="xl">
              {t("message", { number: message.number })}
            </Heading>
            <Text color="fg.muted" fontVariantNumeric="tabular-nums">
              {message.when}
            </Text>
          </Stack>
          <MessageEditor
            key={message.sessionId}
            number={message.number}
            read={
              <Stack gap="10">
                <MessageSection title={t("hymns")}>
                  <HymnTable hymns={message.hymns} />
                </MessageSection>
                <MessageSection title={t("verses")} help={t("versesHelp")}>
                  <VerseList verses={message.verses} />
                  <Button asChild variant="ghost" color="fg" alignSelf="flex-start">
                    <LocaleLink href={screen}>{t("previewSlides")}</LocaleLink>
                  </Button>
                </MessageSection>
              </Stack>
            }
            edit={
              <Stack gap="10">
                <MessageSection title={t("hymns")}>
                  <HymnsForm initialHymns={message.hymns} action={props.actions.saveHymns} />
                </MessageSection>
                <MessageSection title={t("verses")} help={t("versesHelp")}>
                  <VersesForm initialVerses={message.verses} action={props.actions.saveVerses} />
                </MessageSection>
              </Stack>
            }
          />
        </Stack>
      </Flex>
    </Stack>
  );
}
