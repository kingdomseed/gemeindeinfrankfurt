import { SimpleGrid, Span, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { CheckboxChoice } from "@/components/ui/choice";
import { FormSection } from "@/components/ui/form-section";

import type { SessionOption } from "./types";

export function SessionsSection(props: {
  sessions: SessionOption[];
  chosen: ReadonlySet<string>;
  missing: boolean;
  onPick: () => void;
  locked?: boolean | undefined;
}) {
  const t = useTranslations("register");
  return (
    <FormSection legend={t("sessions")} disabled={props.locked}>
      {props.missing && (
        <Text id="sessions-error" mb="2" fontWeight="semibold" color="fg.error">
          {t("sessionsRequired")}
        </Text>
      )}
      <SimpleGrid columns={{ base: 1, sm: 2 }} columnGap="6">
        {props.sessions.map((s) => (
          <CheckboxChoice
            key={s.id}
            name="session_ids"
            value={s.id}
            defaultChecked={props.chosen.has(s.id)}
            disabled={props.locked}
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
