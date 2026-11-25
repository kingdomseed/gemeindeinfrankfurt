"use client";

import { Button, chakra, Grid, HStack, Input, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { hymnsFingerprint } from "@/lib/domain/list-sync";
import type { Hymn } from "@/lib/domain/messages";

import { ConflictBanner } from "./ConflictBanner";
import { FormResult } from "./FormResult";
import type { FormAction } from "./types";
import { useCollaborativeList } from "./useCollaborativeList";

const emptyHymn = (): Hymn => ({ en: "", de: "", ru: "" });

// Hymn numbers for one message, quick to type when they arrive late. A box
// left empty means the hymn does not exist in that language.
export function HymnsForm(props: {
  // What is saved now; the form keeps its own copy while it is open.
  initialHymns: readonly Hymn[];
  action: FormAction;
}) {
  const t = useTranslations("coordinator.messages");
  const tl = useTranslations("common.languages");
  const list = useCollaborativeList({
    initial: props.initialHymns,
    fingerprint: hymnsFingerprint,
    createEmpty: emptyHymn,
    action: props.action,
  });

  const change = (key: number, field: "en" | "de" | "ru", value: string) =>
    list.update(key, (row) => ({ ...row, [field]: value }));

  const columns = { base: "2rem repeat(3, minmax(0, 1fr)) auto" };
  return (
    <chakra.form onSubmit={list.submit} display="flex" flexDirection="column" gap="3">
      <Grid templateColumns={columns} gap="2" alignItems="center" fontSize="sm" color="fg.muted">
        <Text>{t("order")}</Text>
        <Text>{tl("en")}</Text>
        <Text>{tl("de")}</Text>
        <Text>{tl("ru")}</Text>
        <span />
      </Grid>
      {list.items.map((row, i) => (
        <Grid key={row.key} templateColumns={columns} gap="2" alignItems="center">
          <Text fontVariantNumeric="tabular-nums">{i + 1}</Text>
          <Input
            name="en"
            value={row.en}
            onChange={(e) => change(row.key, "en", e.currentTarget.value)}
            inputMode="numeric"
            required
            maxLength={20}
            aria-label={t("hymnNumber", { number: i + 1, language: tl("en") })}
          />
          <Input
            name="de"
            value={row.de ?? ""}
            onChange={(e) => change(row.key, "de", e.currentTarget.value)}
            inputMode="numeric"
            maxLength={20}
            aria-label={t("hymnNumber", { number: i + 1, language: tl("de") })}
          />
          <Input
            name="ru"
            value={row.ru ?? ""}
            onChange={(e) => change(row.key, "ru", e.currentTarget.value)}
            inputMode="numeric"
            maxLength={20}
            aria-label={t("hymnNumber", { number: i + 1, language: tl("ru") })}
          />
          <Button
            variant="ghost"
            size="sm"
            color="fg"
            onClick={() => list.remove(row.key)}
            aria-label={t("removeHymn", { number: i + 1 })}
          >
            {t("remove")}
          </Button>
        </Grid>
      ))}
      <ConflictBanner {...list.bannerProps} />
      <HStack gap="3" wrap="wrap">
        <Button variant="outline" color="fg" onClick={list.add}>
          {t("addHymn")}
        </Button>
        <Button type="submit" loading={list.pending}>
          {t("saveHymns")}
        </Button>
      </HStack>
      <FormResult state={list.result} saved={t("saved")} />
    </chakra.form>
  );
}
