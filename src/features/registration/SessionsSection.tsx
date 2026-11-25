import { SimpleGrid, Span, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { CheckboxChoice } from "@/components/ui/choice";
import { FormSection } from "@/components/ui/form-section";

import { useRegistrationForm } from "./RegistrationFormContext";
import type { SessionOption } from "./types";

// Part-time and Anaheim seats pick their messages. `missing` is set when the
// form was sent without one.
export function SessionsSection(props: {
  sessions: SessionOption[];
  missing: boolean;
  onPick: () => void;
}) {
  const t = useTranslations("register");
  const { state, meta } = useRegistrationForm();
  const chosen = new Set(meta.defaults?.session_ids);
  return (
    <FormSection legend={t("sessions")} disabled={meta.locked}>
      <Text mb="2">
        {state.seatType === "anaheim" ? t("sessionsAnaheimHint") : t("sessionsPartHint")}
      </Text>
      {props.missing && (
        <Text id="sessions-error" mb="2" fontWeight="semibold" color="fg.error">
          {t("sessionsRequired")}
        </Text>
      )}
      <SimpleGrid columns={{ base: 1, md: 2 }} columnGap="6">
        {props.sessions.map((s) => (
          <CheckboxChoice
            key={s.id}
            name="session_ids"
            value={s.id}
            defaultChecked={chosen.has(s.id)}
            disabled={meta.locked}
            invalid={props.missing}
            describedBy={props.missing ? "sessions-error" : undefined}
            onCheckedChange={props.onPick}
          >
            <Span fontVariantNumeric="tabular-nums">{s.label}</Span>
          </CheckboxChoice>
        ))}
      </SimpleGrid>
    </FormSection>
  );
}
