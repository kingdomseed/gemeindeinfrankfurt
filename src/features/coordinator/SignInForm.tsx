"use client";

import { Button, chakra, Input } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { FormField } from "@/components/ui/form-field";
import { Notice } from "@/components/ui/notice";
import { createClient } from "@/lib/supabase/browser";

// Sends a coordinator a sign-in link by email.
export function SignInForm() {
  const t = useTranslations("coordinator");
  const locale = useLocale();
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(form: FormData) {
    const email = form.get("email");
    if (typeof email !== "string") return;
    startTransition(async () => {
      await createClient().auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // coordinators are invited by an admin
          // The email's link (supabase/templates/magic-link.html) passes this on to /api/auth/confirm.
          emailRedirectTo: `${window.location.origin}/${locale}/training/coordinator`,
        },
      });
      setSent(true); // Same message either way, so the form doesn't reveal who is a coordinator.
    });
  }

  if (sent) {
    return (
      <Notice tone="success" announce="status">
        {t("linkSent")}
      </Notice>
    );
  }
  return (
    <chakra.form action={onSubmit} display="flex" flexDirection="column" gap="4">
      <FormField label={t("emailLabel")} required>
        <Input name="email" type="email" autoComplete="email" spellCheck={false} />
      </FormField>
      <Button type="submit" width="full" loading={pending}>
        {t("sendLink")}
      </Button>
    </chakra.form>
  );
}
