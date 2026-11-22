import { SimpleGrid, Text, Textarea } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { SelectField } from "@/components/ui/select-field";
import { isLanguage, languages, type Language } from "@/lib/domain/types";

import { useRegistrationForm } from "./RegistrationFormContext";

export function LanguagesSection() {
  const t = useTranslations("register");
  const locale = useLocale();
  const { state, actions, meta } = useRegistrationForm();
  // Anaheim attendees already have their outlines, so they choose none.
  const needsOutline = state.seatType !== "anaheim";
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
          field={{ name: "group_language", defaultValue: meta.defaults?.group_language ?? locale }}
        >
          {options(languages)}
        </SelectField>
        {needsOutline && (
          <>
            <SelectField
              label={t("outlineLanguage")}
              field={{
                name: "outline_language",
                value: state.outline,
                onChange: (e) => {
                  if (isLanguage(e.currentTarget.value)) actions.setOutline(e.currentTarget.value);
                },
              }}
            >
              {options(languages)}
            </SelectField>
            <SelectField
              label={t("secondOutlineLanguage")}
              field={{
                name: "second_outline_language",
                value: state.second,
                onChange: (e) => {
                  const v = e.currentTarget.value;
                  actions.setSecond(isLanguage(v) ? v : "");
                },
              }}
            >
              <option value="">{t("none")}</option>
              {options(languages.filter((l) => l !== state.outline))}
            </SelectField>
          </>
        )}
      </SimpleGrid>
      {needsOutline && <Text fontWeight="medium">{t("outlinesRule")}</Text>}
      <FormField label={t("comments")} optionalLabel={t("optional")}>
        <Textarea name="comments" defaultValue={meta.defaults?.comments} rows={3} />
      </FormField>
    </FormSection>
  );
}
