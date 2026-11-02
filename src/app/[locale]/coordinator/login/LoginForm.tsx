"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { createClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const t = useTranslations("coordinator");
  const tr = useTranslations("register");
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

  if (sent) return <p>{t("linkSent")}</p>;
  return (
    <form action={onSubmit} className="space-y-3">
      <label className="block">
        {tr("email")}
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <button type="submit" className="rounded bg-teal-800 px-5 py-2 font-semibold text-white">
        {t("sendLink")}
      </button>
    </form>
  );
}
