import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireLocale } from "@/i18n/locale";
import { Link } from "@/i18n/navigation";
import { getPublishedTraining } from "@/lib/data";
import { formatEuro } from "@/lib/domain/fees";
import { sessionLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const training = await getPublishedTraining();

  if (!training) return <p className="mt-10">{t("noTraining")}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{training.title[locale]}</h1>
      <p>
        {t("fee", {
          fee: formatEuro(training.fee_cents, locale),
          outline: formatEuro(training.outline_price_cents, locale),
        })}
      </p>
      <section>
        <h2 className="text-xl font-semibold">{t("schedule")}</h2>
        <ul className="mt-2 space-y-1">
          {training.sessions.map((s) => (
            <li key={s.id}>
              {sessionLabel(s, locale, t("message", { number: s.message_number }))}
            </li>
          ))}
        </ul>
      </section>
      <Link
        href="/register"
        className="inline-block rounded bg-teal-800 px-5 py-2 font-semibold text-white"
      >
        {t("register")}
      </Link>
    </div>
  );
}
