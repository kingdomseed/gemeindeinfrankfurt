"use client";

import { Button, chakra, Fieldset, HStack, Input, Textarea } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { FormField } from "@/components/ui/form-field";
import { versesFingerprint } from "@/lib/domain/list-sync";
import type { Verse } from "@/lib/domain/messages";
import { languages } from "@/lib/domain/types";

import { ConflictBanner } from "./ConflictBanner";
import { FormResult } from "./FormResult";
import type { FormAction } from "./types";
import { useCollaborativeList } from "./useCollaborativeList";

const emptyVerse = (): Verse => ({ ref: "", text: {} });

// The verses of one message in reading order, one slide each, with the text
// in every language the screens show.
export function VersesForm(props: {
  // What is saved now; the form keeps its own copy while it is open.
  initialVerses: readonly Verse[];
  action: FormAction;
}) {
  const t = useTranslations("coordinator.messages");
  const tl = useTranslations("common.languages");
  const list = useCollaborativeList({
    initial: props.initialVerses,
    fingerprint: versesFingerprint,
    createEmpty: emptyVerse,
    action: props.action,
  });

  return (
    <chakra.form onSubmit={list.submit} display="flex" flexDirection="column" gap="4">
      {list.items.map((row, i) => (
        <Fieldset.Root key={row.key} borderWidth="1px" rounded="lg" p="4" gap="3">
          <Fieldset.Legend fontWeight="medium">
            {t("verseNumber", { number: i + 1 })}
          </Fieldset.Legend>
          <FormField label={t("reference")}>
            <Input
              name="ref"
              value={row.ref}
              onChange={(e) => {
                const ref = e.currentTarget.value;
                list.update(row.key, (r) => ({ ...r, ref }));
              }}
              required
              maxLength={100}
            />
          </FormField>
          {languages.map((l) => (
            <FormField key={l} label={tl(l)}>
              <Textarea
                name={`text_${l}`}
                value={row.text[l] ?? ""}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  list.update(row.key, (r) => ({ ...r, text: { ...r.text, [l]: value } }));
                }}
                rows={3}
                maxLength={4000}
                lang={l}
              />
            </FormField>
          ))}
          <Button
            variant="ghost"
            size="sm"
            color="fg"
            alignSelf="flex-start"
            onClick={() => list.remove(row.key)}
          >
            {t("removeVerse", { number: i + 1 })}
          </Button>
        </Fieldset.Root>
      ))}
      <ConflictBanner {...list.bannerProps} />
      <HStack gap="3" wrap="wrap">
        <Button variant="outline" color="fg" onClick={list.add}>
          {t("addVerse")}
        </Button>
        <Button type="submit" loading={list.pending}>
          {t("saveVerses")}
        </Button>
      </HStack>
      <FormResult state={list.result} saved={t("saved")} />
    </chakra.form>
  );
}
