import { SimpleGrid, Textarea } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { SelectField } from "@/components/ui/select-field";
import { isLanguage, languages, type Language } from "@/lib/domain/types";

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
        <SelectField
          label={t("groupLanguage")}
          field={{ name: "group_language", defaultValue: props.groupLanguage }}
        >
          {options(languages)}
        </SelectField>
        <SelectField
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
        </SelectField>
        <SelectField
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
        </SelectField>
      </SimpleGrid>
      <FormField label={t("comments")} optionalLabel={t("optional")}>
        <Textarea name="comments" defaultValue={props.comments} rows={3} bg="bg" />
      </FormField>
    </FormSection>
  );
}
