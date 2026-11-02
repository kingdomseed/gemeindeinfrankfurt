import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPublishedTraining } from "@/lib/data";
import { formatEuro } from "@/lib/domain/fees";
import type { Language } from "@/lib/domain/types";
import { sessionLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const training = await getPublishedTraining();

  if (!training) return <p className="mt-10">{t("noTraining")}</p>;

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">{training.title[locale as Language]}</h1>
        <p className="text-lg">
          {t("fee", {
            fee: formatEuro(training.fee_cents, locale),
            outline: formatEuro(training.outline_price_cents, locale),
          })}
        </p>
        <Link
          href="/register"
          className="inline-flex min-h-11 items-center rounded-md bg-brand px-6 font-semibold text-brand-ink no-underline hover:bg-brand-hover"
        >
          {t("register")}
        </Link>
      </div>
      <section aria-labelledby="schedule-heading">
        <h2 id="schedule-heading" className="text-xl font-semibold">
          {t("schedule")} <span className="text-base font-normal text-muted">· {t("scheduleCount", { count: training.sessions.length })}</span>
        </h2>
        <p className="mt-1 text-sm text-muted">{tc("timezone")}</p>
        <ol className="mt-4 divide-y divide-line border-y border-line tabular-nums">
          {training.sessions.map((s) => (
            <li key={s.id} className="py-2">
              {sessionLabel(s, locale, t("message", { number: s.message_number }))}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
