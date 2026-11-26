"use client";

import { Box, Button, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

export type Slide = { meta: string; title: string; body: string; lang: string };
export type SlideSection = { label: string; startIndex: number };

// The slides for the room's screen: rules, hymns and verses, one at a time,
// on a dark background. Arrow keys and the space bar move between them.
export function SlideShow(props: {
  slides: readonly Slide[];
  footer: string;
  sections?: readonly SlideSection[];
}) {
  const t = useTranslations("coordinator.screen");
  const [index, setIndex] = useState(0);
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
      className="dark"
      colorPalette="brand"
      bg="bg"
      color="fg"
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
          aspectRatio: "auto",
          height: "100dvh",
          maxHeight: "none",
        },
      }}
    >
      {slide ? (
        <Flex direction="column" flex="1" minH="0" lang={slide.lang}>
          <Flex justify="space-between" align="center" gap="3" wrap="wrap" flexShrink={0}>
            <Text fontSize={{ base: "sm", md: "lg" }} color="fg.muted">
              {slide.meta}
            </Text>
            {props.sections && props.sections.length > 1 && (
              <HStack gap="1">
                {props.sections.map((s) => {
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
                      onClick={() => setIndex(s.startIndex)}
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
            justify="center"
            flex="1"
            minH="0"
            gap={{ base: "3", md: "5" }}
            py={{ base: "4", md: "6" }}
            maxW="5xl"
          >
            <Heading
              as="h2"
              flexShrink={0}
              fontSize={{ base: "2xl", md: "5xl" }}
              lineHeight="shorter"
              textWrap="balance"
            >
              {slide.title}
            </Heading>
            {slide.body && (
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
            )}
          </Flex>
        </Flex>
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
        pt="3"
      >
        <Text fontSize="sm" color="fg.muted">
          {props.footer}
          {count > 0 && ` · ${current + 1} / ${count}`}
        </Text>
        <HStack gap="2">
          <Button
            variant="ghost"
            color="fg.muted"
            _hover={{ color: "fg", bg: "bg.muted" }}
            disabled={current === 0}
            onClick={() => setIndex(current - 1)}
          >
            {t("previous")}
          </Button>
          <Button
            variant="ghost"
            color="fg.muted"
            _hover={{ color: "fg", bg: "bg.muted" }}
            disabled={current >= count - 1}
            onClick={() => setIndex(current + 1)}
          >
            {t("next")}
          </Button>
          <Button
            variant="ghost"
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
