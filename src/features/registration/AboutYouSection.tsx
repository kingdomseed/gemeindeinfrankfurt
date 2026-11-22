import { SimpleGrid } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { FormSection } from "@/components/ui/form-section";

import { useRegistrationForm } from "./RegistrationFormContext";
import { TextField } from "./TextField";

export function AboutYouSection() {
  const t = useTranslations("register");
  const { state, meta } = useRegistrationForm();
  const d = meta.defaults;
  return (
    <FormSection legend={t("sectionAboutYou")}>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
        <TextField
          name="first_name"
          autoComplete="given-name"
          label={t("firstName")}
          value={d?.first_name}
          required
        />
        <TextField
          name="last_name"
          autoComplete="family-name"
          label={t("lastName")}
          value={d?.last_name}
          required
        />
        {state.seatType === "shared" && (
          <>
            <TextField
              name="partner_first_name"
              autoComplete="off"
              label={t("partnerFirstName")}
              value={d?.partner_first_name}
              required
              disabled={meta.locked}
            />
            <TextField
              name="partner_last_name"
              autoComplete="off"
              label={t("partnerLastName")}
              value={d?.partner_last_name}
              required
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
          required
        />
        <TextField
          name="phone"
          type="tel"
          autoComplete="tel"
          label={t("phone")}
          optional
          value={d?.phone}
        />
      </SimpleGrid>
    </FormSection>
  );
}
