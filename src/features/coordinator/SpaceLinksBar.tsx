"use client";

import { Box, Button, chakra, Flex, HStack, Input, Link, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { FormField } from "@/components/ui/form-field";
import { StatusTag } from "@/components/ui/status-tag";
import { usePathname } from "@/i18n/navigation";
import { detectLinkKind } from "@/lib/domain/links";
import type { SpaceLink } from "@/lib/links";

import { FormResult } from "./FormResult";
import { sectionFromPath } from "./sections";
import type { FormAction, FormState } from "./types";

// Compact external-link bar shown in each coordinator space so coordinators can
// drop shared Google Docs / Sheets / Slides when falling back or collaborating.
export function SpaceLinksBar(props: {
  links: readonly SpaceLink[];
  addLink: FormAction;
  removeLink: (form: FormData) => Promise<void>;
}) {
  const t = useTranslations("coordinator.links");
  const section = sectionFromPath(usePathname());
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (prev, form) => {
      const result = await props.addLink(prev, form);
      if (result.status === "saved") setOpen(false);
      return result;
    },
    { status: "idle" },
  );

  if (!section) return null;
  const visible = props.links.filter((l) => l.section === section);
  const active = visible.length > 0 || open;

  return (
    <Box
      as="section"
      aria-label={t("title")}
      bg={active ? "bg.subtle" : "transparent"}
      borderWidth={active ? "1px" : "0"}
      borderColor="border"
      rounded="lg"
      px={active ? { base: "3", sm: "4" } : "0"}
      py={active ? "2.5" : "0"}
      mb={active ? "5" : "4"}
      _print={{ display: "none" }}
    >
      <Flex justify="space-between" align="center" gap="3" flexWrap="nowrap">
        <Text
          fontSize={active ? "sm" : "xs"}
          fontWeight={active ? "medium" : "normal"}
          color="fg.muted"
          minW="0"
          truncate
        >
          {t("title")}
        </Text>
        <Button
          type="button"
          size="xs"
          variant="outline"
          color="fg"
          flexShrink={0}
          minH="9"
          touchAction="manipulation"
          userSelect="none"
          onClick={() => setOpen((was) => !was)}
          aria-expanded={open}
        >
          {open ? t("cancel") : t("attach")}
        </Button>
      </Flex>

      {visible.length > 0 && (
        <Flex wrap="wrap" gap="3" mt="2.5" align="center">
          {visible.map((link) => (
            <HStack
              key={link.id}
              gap="2"
              maxW="full"
              bg="bg"
              borderWidth="1px"
              borderColor="border"
              rounded="md"
              px="2.5"
              py="1"
            >
              <StatusTag tone="brand">{t(`kind.${detectLinkKind(link.url)}`)}</StatusTag>
              <Link
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                fontSize="sm"
                fontWeight="medium"
                textDecoration="underline"
                color="fg"
                minW="0"
                truncate
              >
                {link.title}
              </Link>
              {link.addedBy && (
                <Text as="span" fontSize="xs" color="fg.muted" flexShrink={0}>
                  · {link.addedBy}
                </Text>
              )}
              <form action={props.removeLink}>
                <input type="hidden" name="id" value={link.id} />
                <Button
                  type="submit"
                  size="xs"
                  variant="ghost"
                  color="fg.muted"
                  aria-label={`${t("remove")}: ${link.title}`}
                >
                  {t("remove")}
                </Button>
              </form>
            </HStack>
          ))}
        </Flex>
      )}

      {open && (
        <chakra.form
          action={formAction}
          mt="3"
          display="flex"
          flexWrap="wrap"
          alignItems="flex-end"
          gap="3"
        >
          <input type="hidden" name="section" value={section} />
          <Box flex="2 1 16rem">
            <FormField label={t("urlLabel")} required>
              <Input
                name="url"
                type="url"
                placeholder={t("urlPlaceholder")}
                required
                maxLength={2000}
                spellCheck={false}
              />
            </FormField>
          </Box>
          <Box flex="1 1 12rem">
            <FormField label={t("titleLabel")} optionalLabel={t("optional")}>
              <Input name="title" maxLength={120} />
            </FormField>
          </Box>
          <Button type="submit" size="sm" loading={pending}>
            {t("add")}
          </Button>
        </chakra.form>
      )}

      {state.status === "error" && (
        <Box mt="2">
          <FormResult state={state} saved="" />
        </Box>
      )}
    </Box>
  );
}
