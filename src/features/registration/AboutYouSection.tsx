import { Input, SimpleGrid } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { SelectField } from "@/components/ui/select-field";

import { useRegistrationForm } from "./RegistrationFormContext";
import { TextField } from "./TextField";

export function AboutYouSection() {
  const t = useTranslations("register");
  const { state, actions, meta } = useRegistrationForm();
  const d = meta.defaults;
  return (
    <FormSection legend={t("sectionAboutYou")}>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
        <TextField
          name="first_name"
          autoComplete="given-name"
          label={t("firstName")}
          value={d?.first_name}
        />
        <TextField
          name="last_name"
          autoComplete="family-name"
          label={t("lastName")}
          value={d?.last_name}
        />
        {state.seatType === "shared" && (
          <>
            <TextField
              name="partner_first_name"
              autoComplete="off"
              label={t("partnerFirstName")}
              value={d?.partner_first_name}
              disabled={meta.locked}
            />
            <TextField
              name="partner_last_name"
              autoComplete="off"
              label={t("partnerLastName")}
              value={d?.partner_last_name}
              disabled={meta.locked}
            />
          </>
        )}
        <TextField
          name="email"
          type="email"
          autoComplete="email"
          label={t("email")}
          value={d?.email}
        />
        <TextField
          name="phone"
          type="tel"
          autoComplete="tel"
          label={t("phone")}
          optional
          value={d?.phone}
        />
        <SelectField
          label={t("locality")}
          required
          field={{
            name: "locality",
            value: state.locality,
            onChange: (e) => actions.setLocality(e.currentTarget.value),
          }}
        >
          <option value="" disabled>
            {t("choose")}
          </option>
          {meta.localities.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
          <option value="other">{t("otherLocality")}</option>
        </SelectField>
        {meta.sites.length > 1 && (
          <SelectField
            label={t("site")}
            required
            field={{
              name: "site_id",
              value: state.siteId,
              onChange: (e) => actions.setSiteId(e.currentTarget.value),
            }}
          >
            <option value="" disabled>
              {t("choose")}
            </option>
            {meta.sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>
        )}
        {state.locality === "other" && (
          <FormField label={t("otherLocalityLabel")} required>
            <Input
              name="other_locality"
              value={state.otherLocality}
              onChange={(e) => actions.setOtherLocality(e.currentTarget.value)}
              autoComplete="address-level2"
              maxLength={100}
            />
          </FormField>
        )}
      </SimpleGrid>
      {meta.sites.length === 1 && <input type="hidden" name="site_id" value={state.siteId} />}
    </FormSection>
  );
}
