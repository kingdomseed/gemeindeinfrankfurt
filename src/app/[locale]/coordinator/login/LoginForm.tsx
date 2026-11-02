"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { fieldClass } from "@/components/styles";
import { createClient } from "@/lib/supabase/browser";

export function LoginForm() {
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
      <output className="block rounded-lg bg-success-bg p-4 text-success-ink">
        {t("linkSent")}
      </output>
    );
  }
  return (
    <form action={onSubmit} className="space-y-4">
      <label className="block">
        {t("emailLabel")}
        <input name="email" type="email" autoComplete="email" required className={fieldClass} />
      </label>
      <button
        type="submit"
        className="min-h-11 rounded-md bg-brand px-6 font-semibold text-brand-ink hover:bg-brand-hover"
      >
        {t("sendLink")}
      </button>
    </form>
  );
}
