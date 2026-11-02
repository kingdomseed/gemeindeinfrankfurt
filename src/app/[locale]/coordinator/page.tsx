import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { getCoordinatorClient } from "@/lib/auth";
import { localizedText } from "@/lib/data";
import { computeFees, formatEuro } from "@/lib/domain/fees";
import { countOutlines } from "@/lib/domain/outlines";
import { languages } from "@/lib/domain/types";

import { setOutlineOrder, signOut } from "./actions";
import { LiveRefresh } from "./LiveRefresh";
import { PaymentToggle } from "./PaymentToggle";

export const dynamic = "force-dynamic";

export default async function CoordinatorPage({ params }: PageProps<"/[locale]/coordinator">) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const supabase = await getCoordinatorClient();
  if (!supabase) return redirect({ href: "/coordinator/login", locale });

  const [t, tr, tl, { data: training }] = await Promise.all([
    getTranslations("coordinator"),
    getTranslations("register"),
    getTranslations("common.languages"),
    supabase
      .from("trainings")
      .select("id, title, fee_cents, outline_price_cents")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!training) return <p className="mt-10">—</p>;

  const [{ data: rows }, { data: orders }] = await Promise.all([
    supabase
      .from("registrations")
      .select(
        "id, seat_type, first_name, last_name, partner_first_name, partner_last_name, group_language, outline_language, second_outline_language, attended_anaheim, ukraine_not_employed, waiver, fee_paid, outline_paid",
      )
      .eq("training_id", training.id)
      .eq("status", "active")
      .order("last_name"),
    supabase.from("outline_orders").select("language, quantity").eq("training_id", training.id),
  ]);
  const regs = rows ?? [];
  const prices = { feeCents: training.fee_cents, outlinePriceCents: training.outline_price_cents };

  let feesReceived = 0;
  let outlinesReceived = 0;
  let unpaid = 0;
  for (const r of regs) {
    const f = computeFees(
      {
        seatType: r.seat_type,
        attendedAnaheim: r.attended_anaheim,
        ukraineNotEmployed: r.ukraine_not_employed,
        hardshipWaiver: r.waiver === "hardship",
        outlineLanguage: r.outline_language,
        secondOutlineLanguage: r.second_outline_language,
      },
      prices,
    );
    if (r.fee_paid) feesReceived += f.trainingCents;
    else unpaid += f.trainingCents;
    if (r.outline_paid) outlinesReceived += f.outlineCents;
    else unpaid += f.outlineCents;
  }

  const needed = countOutlines(regs);
  const ordered = Object.fromEntries((orders ?? []).map((o) => [o.language, o.quantity]));
  const euro = (c: number) => formatEuro(c, locale);

  return (
    <div className="space-y-8">
      <LiveRefresh trainingId={training.id} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {t("title")}: {localizedText.parse(training.title)[locale]}
        </h1>
        <form action={signOut}>
          <button type="submit" className="text-sm underline">
            {t("signOut")}
          </button>
        </form>
      </div>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={t("seats")} value={String(regs.length)} />
        <Stat label={t("feesReceived")} value={euro(feesReceived)} />
        <Stat label={t("outlinesReceived")} value={euro(outlinesReceived)} />
        <Stat label={t("unpaid")} value={euro(unpaid)} />
      </dl>

      <section>
        <h2 className="text-xl font-semibold">{t("outlineCounts")}</h2>
        <table className="mt-2 text-left">
          <thead>
            <tr>
              <th className="pr-6">
                <span className="sr-only">{t("languages")}</span>
              </th>
              <th className="pr-6">{t("outlineCounts")}</th>
              <th className="pr-6">{t("ordered")}</th>
              <th>{t("extra")}</th>
            </tr>
          </thead>
          <tbody>
            {languages.map((l) => (
              <tr key={l}>
                <td className="pr-6">{tl(l)}</td>
                <td className="pr-6">{needed[l]}</td>
                <td className="pr-6">
                  <form action={setOutlineOrder} className="flex gap-2">
                    <input type="hidden" name="training_id" value={training.id} />
                    <input type="hidden" name="language" value={l} />
                    <input
                      name="quantity"
                      type="number"
                      min={0}
                      aria-label={`${t("ordered")}: ${tl(l)}`}
                      defaultValue={ordered[l] ?? 0}
                      className="w-20 rounded border border-neutral-300 px-2 dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <button type="submit" className="text-sm underline">
                      OK
                    </button>
                  </form>
                </td>
                <td>{(ordered[l] ?? 0) - needed[l]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="overflow-x-auto">
        <h2 className="text-xl font-semibold">{t("registrations")}</h2>
        <table className="mt-2 w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">{t("name")}</th>
              <th>{t("seat")}</th>
              <th>{t("languages")}</th>
              <th>{t("feePaid")}</th>
              <th>{t("outlinePaid")}</th>
            </tr>
          </thead>
          <tbody>
            {regs.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2">
                  {r.first_name} {r.last_name}
                  {r.seat_type === "shared" && ` + ${r.partner_first_name} ${r.partner_last_name}`}
                </td>
                <td>{tr(`seat.${r.seat_type}`).split(" (")[0]}</td>
                <td>
                  {r.group_language.toUpperCase()} / {r.outline_language.toUpperCase()}
                  {r.second_outline_language && ` + ${r.second_outline_language.toUpperCase()}`}
                </td>
                <td>
                  <PaymentToggle
                    id={r.id}
                    field="fee_paid"
                    value={r.fee_paid}
                    label={t("feePaid")}
                  />
                </td>
                <td>
                  <PaymentToggle
                    id={r.id}
                    field="outline_paid"
                    value={r.outline_paid}
                    label={t("outlinePaid")}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-neutral-300 p-3 dark:border-neutral-700">
      <dt className="text-sm text-neutral-600 dark:text-neutral-400">{label}</dt>
      <dd className="text-xl font-semibold">{value}</dd>
    </div>
  );
}
