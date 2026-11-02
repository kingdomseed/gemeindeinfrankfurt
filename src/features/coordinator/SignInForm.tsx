"use client";

import { Button, chakra, Input } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { FormField } from "@/components/ui/form-field";
import { Notice } from "@/components/ui/notice";
import { createClient } from "@/lib/supabase/browser";

// Sends a coordinator a sign-in link by email.
export function SignInForm() {
  const t = useTranslations("coordinator");
  const locale = useLocale();
  const [sent, setSent] = useState(false);

  async function onSubmit(form: FormData) {
    const email = form.get("email");
    if (typeof email !== "string") return;
    const next = `/${locale}/coordinator`;
    await createClient().auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // coordinators are invited by an admin
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setSent(true); // Same message either way, so the form doesn't reveal who is a coordinator.
  }

  if (sent) {
    return (
      <Notice tone="success" announce="status">
        {t("linkSent")}
      </Notice>
    );
  }
  return (
    <chakra.form
      action={onSubmit}
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      gap="4"
    >
      <FormField label={t("emailLabel")} required>
        <Input name="email" type="email" autoComplete="email" />
      </FormField>
      <Button type="submit" px="6">
        {t("sendLink")}
      </Button>
    </chakra.form>
  );
}
