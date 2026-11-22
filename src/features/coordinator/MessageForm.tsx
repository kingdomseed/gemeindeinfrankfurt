"use client";

import { Button, chakra, HStack, Input, NativeSelect, Stack, Textarea } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Notice } from "@/components/ui/notice";
import { fallbackLanguages } from "@/lib/domain/emails";
import { languages, type Language } from "@/lib/domain/types";

import { ConfirmSendDialog } from "./ConfirmSendDialog";
import { FormResult } from "./FormResult";
import type { FormState } from "./types";

export type AudienceOption = {
  value: string;
  label: string;
  count: number;
  byLocale: Record<Language, number>;
};

function filled(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name);
  return (
    (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) &&
    field.value.trim() !== ""
  );
}

// A message to everyone or a group, written in each language the
// coordinators have. Readers whose language is missing get English.
export function MessageForm(props: {
  audiences: readonly AudienceOption[];
  send: (prev: FormState, form: FormData) => Promise<FormState>;
}) {
  const t = useTranslations("coordinator.emails");
  const tl = useTranslations("common.languages");
  const [state, formAction, pending] = useActionState<FormState, FormData>(props.send, {
    status: "idle",
  });
  const [audience, setAudience] = useState(props.audiences[0]?.value ?? "everyone");
  const [written, setWritten] = useState<ReadonlySet<Language>>(new Set());
  const chosen = props.audiences.find((a) => a.value === audience) ?? props.audiences[0];
  const count = chosen?.count ?? 0;
  const missing = new Set(chosen ? fallbackLanguages(chosen.byLocale, written) : []);

  const onText = (l: Language, form: HTMLFormElement | null) => {
    if (!form) return;
    const next = new Set(written);
    if (filled(form, `subject_${l}`) && filled(form, `body_${l}`)) next.add(l);
    else next.delete(l);
    setWritten(next);
  };

  return (
    <chakra.form
      id="coordinator-message"
      action={formAction}
      display="flex"
      flexDirection="column"
      gap="6"
    >
      <Stack maxW="md">
        <FormField label={t("to")}>
          <NativeSelect.Root>
            <NativeSelect.Field
              name="audience"
              value={audience}
              onChange={(e) => setAudience(e.currentTarget.value)}
            >
              {props.audiences.map((a) => (
                <option key={a.value} value={a.value}>
                  {t("audienceOption", { label: a.label, count: a.count })}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </FormField>
      </Stack>
      {languages.map((l) => (
        <FormSection key={l} legend={tl(l)}>
          <FormField label={t("subject")} required={l === "en"}>
            <Input
              name={`subject_${l}`}
              lang={l}
              maxLength={200}
              required={l === "en"}
              onChange={(e) => onText(l, e.currentTarget.form)}
            />
          </FormField>
          <FormField label={t("body")} required={l === "en"}>
            <Textarea
              name={`body_${l}`}
              lang={l}
              rows={5}
              maxLength={10_000}
              required={l === "en"}
              onChange={(e) => onText(l, e.currentTarget.form)}
            />
          </FormField>
          {missing.has(l) && chosen && (
            <Notice tone="warning">
              {t("missingText", { language: tl(l), count: chosen.byLocale[l] })}
            </Notice>
          )}
        </FormSection>
      ))}
      <HStack gap="3" wrap="wrap">
        <ConfirmSendDialog
          form="coordinator-message"
          disabled={count === 0 || !written.has("en")}
          title={t("messageConfirmTitle", { count })}
          body={t("messageConfirmBody")}
          confirm={t("sendTo", { count })}
          trigger={<Button loading={pending}>{t("sendTo", { count })}</Button>}
        />
        <Button type="submit" name="intent" value="test" variant="outline" color="fg">
          {t("sendTest")}
        </Button>
      </HStack>
      <FormResult state={state} saved={state.message ?? ""} />
    </chakra.form>
  );
}
