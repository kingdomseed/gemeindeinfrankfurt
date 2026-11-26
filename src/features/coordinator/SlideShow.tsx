"use client";

import { Box, Button, Flex, Heading, HStack, SimpleGrid, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import type { Language } from "@/lib/domain/types";

export type SlideColumn = {
  lang: Language;
  label: string;
  text: string;
  missing?: boolean;
};

export type Slide = {
  meta: string;
  title: string;
  body: string;
  lang: Language;
  columns?: readonly SlideColumn[];
};

export type SlideSection = { label: string; startIndex: number };

function columnBodyFontSize(longestLength: number) {
  if (longestLength > 360) return { base: "sm", md: "md" };
  if (longestLength > 160) return { base: "md", md: "lg" };
  return { base: "md", md: "xl" };
}

function SlideColumns(props: { columns: readonly SlideColumn[] }) {
  const longest = Math.max(...props.columns.map((c) => c.text.length), 0);
  const colFontSize = columnBodyFontSize(longest);
  return (
    <SimpleGrid
      columns={{ base: 1, md: 3 }}
      gap={{ base: "4", md: "6" }}
      flex="1"
      minH="0"
      overflowY={{ base: "auto", md: "hidden" }}
      pe={{ base: "2", md: "0" }}
      scrollbarWidth="thin"
      css={{ scrollbarColor: "{colors.border.emphasized} transparent" }}
    >
      {props.columns.map((col, i) => (
        <Flex
          key={col.lang}
          direction="column"
          gap="1.5"
          minH="0"
          lang={col.lang}
          borderStartWidth={{ md: i > 0 ? "1px" : "0" }}
          borderTopWidth={{ base: i > 0 ? "1px" : "0", md: "0" }}
          borderColor="border"
          ps={{ md: i > 0 ? "5" : "0" }}
          pt={{ base: i > 0 ? "3" : "0", md: "0" }}
        >
          <Text
            fontSize="xs"
            fontWeight="semibold"
            letterSpacing="wider"
            textTransform="uppercase"
            color="fg.muted"
            flexShrink={0}
          >
            {col.label}
          </Text>
          <Text
            fontSize={colFontSize}
            lineHeight="tall"
            color={col.missing ? "fg.subtle" : "fg"}
            fontStyle={col.missing ? "italic" : "normal"}
            whiteSpace="pre-line"
            overflowY={{ md: "auto" }}
            scrollbarWidth="thin"
            css={{ scrollbarColor: "{colors.border.emphasized} transparent" }}
            minH="0"
            pe={{ md: "2" }}
          >
            {col.text}
          </Text>
        </Flex>
      ))}
    </SimpleGrid>
  );
}

function SlideContent(props: {
  slide: Slide;
  sections: readonly SlideSection[] | undefined;
  activeSectionStart: number | undefined;
  onJump: (index: number) => void;
}) {
  const { slide, sections, activeSectionStart, onJump } = props;
  const hasColumns = Boolean(slide.columns);
  return (
    <Flex direction="column" flex="1" minH="0" lang={slide.lang}>
      <Flex justify="space-between" align="center" gap="3" wrap="wrap" flexShrink={0}>
        <Text fontSize={{ base: "sm", md: "lg" }} color="fg.muted">
          {slide.meta}
        </Text>
        {sections && sections.length > 1 && (
          <HStack gap="1">
            {sections.map((s) => {
              const active = s.startIndex === activeSectionStart;
              return (
                <Button
                  key={s.label}
                  variant="ghost"
                  size="xs"
                  color={active ? "fg" : "fg.muted"}
                  bg={active ? "bg.muted" : "transparent"}
                  _hover={{ color: "fg", bg: "bg.muted" }}
                  fontWeight={active ? "semibold" : "normal"}
                  touchAction="manipulation"
                  userSelect="none"
                  aria-current={active ? "true" : undefined}
                  onClick={() => onJump(s.startIndex)}
                >
                  {s.label}
                </Button>
              );
            })}
          </HStack>
        )}
      </Flex>
      <Flex
        direction="column"
        justify={hasColumns ? "flex-start" : "center"}
        flex="1"
        minH="0"
        gap={{ base: "3", md: "5" }}
        py={{ base: "4", md: "6" }}
        maxW={hasColumns ? "full" : "5xl"}
      >
        <Heading
          as="h2"
          flexShrink={0}
          fontSize={hasColumns ? { base: "2xl", md: "4xl" } : { base: "2xl", md: "5xl" }}
          lineHeight="shorter"
          textWrap="balance"
        >
          {slide.title}
        </Heading>
        {slide.columns ? (
          <SlideColumns columns={slide.columns} />
        ) : (
          slide.body && (
            <Text
              fontSize={
                slide.body.length > 320 ? { base: "md", md: "2xl" } : { base: "lg", md: "3xl" }
              }
              lineHeight="tall"
              color="fg.muted"
              whiteSpace="pre-line"
              overflowY="auto"
              scrollbarWidth="thin"
              css={{ scrollbarColor: "{colors.border.emphasized} transparent" }}
              minH="0"
              pe="2"
            >
              {slide.body}
            </Text>
          )
        )}
      </Flex>
    </Flex>
  );
}

// The slides for the room's screen: rules, hymns and trilingual verses, one at
// a time, defaulting to light mode with an optional dark-mode toggle. Arrow keys
// and the space bar move between them.
export function SlideShow(props: {
  slides: readonly Slide[];
  footer: string;
  sections?: readonly SlideSection[];
}) {
  const t = useTranslations("coordinator.screen");
  const tc = useTranslations("common");
  const [index, setIndex] = useState(0);
  const [dark, setDark] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const count = props.slides.length;
  // A live update can remove slides; the screen then stays on the last one.
  const current = Math.max(0, Math.min(index, count - 1));
  const slide = props.slides[current];
  const activeSectionStart = props.sections?.reduce(
    (active, s) => (s.startIndex <= current ? s.startIndex : active),
    -1,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        setIndex((i) => Math.max(0, Math.min(i + 1, count - 1)));
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setIndex((i) => Math.max(Math.min(i, count - 1) - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  return (
    <Box
      ref={stage}
      className={dark ? "dark" : "light"}
      colorPalette="brand"
      bg="bg"
      color="fg"
      borderWidth={dark ? "0" : "1px"}
      borderColor="border"
      aspectRatio={{ md: "16 / 9" }}
      minH={{ base: "24rem", md: "auto" }}
      maxH={{ base: "75dvh", md: "none" }}
      w="full"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      px={{ base: "5", md: "16" }}
      pt={{ base: "5", md: "10" }}
      pb="4"
      rounded="md"
      css={{
        "&:fullscreen": {
          rounded: "0",
          borderWidth: "0",
          aspectRatio: "auto",
          height: "100dvh",
          maxHeight: "none",
        },
      }}
    >
      {slide ? (
        <SlideContent
          slide={slide}
          sections={props.sections}
          activeSectionStart={activeSectionStart}
          onJump={setIndex}
        />
      ) : (
        <Flex flex="1" align="center">
          <Text fontSize="2xl" color="fg.muted">
            {t("nothing")}
          </Text>
        </Flex>
      )}
      <Flex
        justify="space-between"
        align="center"
        gap="4"
        wrap="wrap"
        flexShrink={0}
        borderTopWidth="1px"
        borderColor="border"
        pt="3"
      >
        <Text fontSize="sm" color="fg.muted">
          {props.footer}
          {count > 0 && ` · ${current + 1} / ${count}`}
        </Text>
        <HStack gap="1" wrap="wrap">
          <Button
            variant="ghost"
            size={{ base: "sm", md: "md" }}
            color="fg.muted"
            _hover={{ color: "fg", bg: "bg.muted" }}
            disabled={current === 0}
            onClick={() => setIndex(current - 1)}
          >
            {t("previous")}
          </Button>
          <Button
            variant="ghost"
            size={{ base: "sm", md: "md" }}
            color="fg.muted"
            _hover={{ color: "fg", bg: "bg.muted" }}
            disabled={current >= count - 1}
            onClick={() => setIndex(current + 1)}
          >
            {t("next")}
          </Button>
          <Button
            variant="ghost"
            size={{ base: "sm", md: "md" }}
            color="fg.muted"
            _hover={{ color: "fg", bg: "bg.muted" }}
            onClick={() => setDark((d) => !d)}
          >
            {dark ? tc("lightMode") : tc("darkMode")}
          </Button>
          <Button
            variant="ghost"
            size={{ base: "sm", md: "md" }}
            color="fg.muted"
            _hover={{ color: "fg", bg: "bg.muted" }}
            onClick={() => {
              if (document.fullscreenElement) {
                void document.exitFullscreen().catch(() => undefined);
              } else {
                void stage.current?.requestFullscreen().catch(() => undefined);
              }
            }}
          >
            {t("fullScreen")}
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}
