"use client";

import { Box, Button, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

export type Slide = { meta: string; title: string; body: string; lang: string };

// The slides for the room's screen: rules, hymns and verses, one at a time,
// on a dark background. Arrow keys and the space bar move between them.
export function SlideShow(props: { slides: readonly Slide[]; footer: string }) {
  const t = useTranslations("coordinator.screen");
  const [index, setIndex] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const count = props.slides.length;
  // A live update can remove slides; the screen then stays on the last one.
  const current = Math.max(0, Math.min(index, count - 1));
  const slide = props.slides[current];

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
      bg="bg"
      color="fg"
      aspectRatio="16 / 9"
      w="full"
      display="flex"
      flexDirection="column"
      px={{ base: "6", md: "16" }}
      pt={{ base: "6", md: "12" }}
      pb="4"
      rounded="md"
      css={{ "&:fullscreen": { rounded: "0" } }}
    >
      {slide ? (
        <Flex direction="column" flex="1" minH="0" lang={slide.lang}>
          <Text fontSize={{ base: "sm", md: "lg" }} color="fg.muted">
            {slide.meta}
          </Text>
          <Flex direction="column" justify="center" flex="1" gap="6" maxW="5xl">
            <Heading
              as="h2"
              fontSize={{ base: "2xl", md: "5xl" }}
              lineHeight="shorter"
              textWrap="balance"
            >
              {slide.title}
            </Heading>
            {slide.body && (
              <Text
                fontSize={{ base: "lg", md: "3xl" }}
                color="fg.muted"
                whiteSpace="pre-line"
                overflowY="auto"
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
      <Flex justify="space-between" align="center" gap="4" wrap="wrap" borderTopWidth="1px" pt="3">
        <Text fontSize="sm" color="fg.muted">
          {props.footer}
          {count > 0 && ` · ${current + 1} / ${count}`}
        </Text>
        <HStack gap="2">
          <Button
            variant="ghost"
            color="fg.muted"
            disabled={current === 0}
            onClick={() => setIndex(current - 1)}
          >
            {t("previous")}
          </Button>
          <Button
            variant="ghost"
            color="fg.muted"
            disabled={current >= count - 1}
            onClick={() => setIndex(current + 1)}
          >
            {t("next")}
          </Button>
          <Button
            variant="ghost"
            color="fg.muted"
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else void stage.current?.requestFullscreen();
            }}
          >
            {t("fullScreen")}
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}
