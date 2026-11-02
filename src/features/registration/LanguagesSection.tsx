import { NativeSelect, SimpleGrid, Textarea } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { isLanguage, languages, type Language } from "@/lib/domain/types";

function Select(props: {
  label: string;
  children: ReactNode;
  field: Parameters<typeof NativeSelect.Field>[0];
}) {
  return (
    <FormField label={props.label}>
      <NativeSelect.Root>
        <NativeSelect.Field bg="bg" {...props.field}>
          {props.children}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </FormField>
  );
}

export function LanguagesSection(props: {
  groupLanguage: Language;
  outline: Language;
  second: Language | "";
  onOutline: (l: Language) => void;
  onSecond: (l: Language | "") => void;
  comments?: string | undefined;
}) {
  const t = useTranslations("register");
  const tl = useTranslations("common.languages");
  const options = (list: readonly Language[]) =>
    list.map((l) => (
      <option key={l} value={l}>
        {tl(l)}
      </option>
    ));
  return (
    <FormSection legend={t("sectionLanguages")}>
      <SimpleGrid columns={{ base: 1, sm: 3 }} gap="4">
        <Select
          label={t("groupLanguage")}
          field={{ name: "group_language", defaultValue: props.groupLanguage }}
        >
          {options(languages)}
        </Select>
        <Select
          label={t("outlineLanguage")}
          field={{
            name: "outline_language",
            value: props.outline,
            onChange: (e) => {
              if (isLanguage(e.currentTarget.value)) props.onOutline(e.currentTarget.value);
            },
          }}
        >
          {options(languages)}
        </Select>
        <Select
          label={t("secondOutlineLanguage")}
          field={{
            name: "second_outline_language",
            value: props.second,
            onChange: (e) => {
              const v = e.currentTarget.value;
              props.onSecond(isLanguage(v) ? v : "");
            },
          }}
        >
          <option value="">{t("none")}</option>
          {options(languages.filter((l) => l !== props.outline))}
        </Select>
      </SimpleGrid>
      <FormField label={t("comments")} optionalLabel={t("optional")}>
        <Textarea name="comments" defaultValue={props.comments} rows={3} bg="bg" />
      </FormField>
    </FormSection>
  );
}
