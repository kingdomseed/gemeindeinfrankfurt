import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireLocale } from "@/i18n/locale";
import { siteContacts } from "@/lib/site";

const sections = [
  "data",
  "purpose",
  "basis",
  "recipients",
  "retention",
  "rights",
  "complaint",
] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "privacy" });
  return { title: t("title") };
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("privacy");
  const contacts = siteContacts();

  return (
    <article className="max-w-prose space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p>{t("intro")}</p>
      </div>
      <section className="space-y-1">
        <h2 className="text-xl font-semibold">{t("controllerTitle")}</h2>
        {contacts.length > 0 ? (
          <>
            <ul>
              {contacts.map((c) => (
                <li key={c.email}>
                  {c.name},{" "}
                  <a href={`mailto:${c.email}`} className="underline">
                    {c.email}
                  </a>
                </li>
              ))}
            </ul>
            <p>{t("controllerBody")}</p>
          </>
        ) : (
          <p>{t("noContact")}</p>
        )}
      </section>
      {sections.map((s) => (
        <section key={s} className="space-y-1">
          <h2 className="text-xl font-semibold">{t(`${s}Title`)}</h2>
          <p>{t(`${s}Body`)}</p>
        </section>
      ))}
    </article>
  );
}
