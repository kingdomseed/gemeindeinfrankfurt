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

  const [t, tl, { data: training }] = await Promise.all([
    getTranslations("coordinator"),
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
        "id, seat_type, first_name, last_name, partner_first_name, partner_last_name, group_language, outline_language, second_outline_language, attended_anaheim, ukraine_not_employed, waiver, payer_name, fee_paid, outline_paid",
      )
      .eq("training_id", training.id)
      .eq("status", "active")
      .order("last_name"),
    supabase.from("outline_orders").select("language, quantity").eq("training_id", training.id),
  ]);
  const regs = rows ?? [];
  const prices = { feeCents: training.fee_cents, outlinePriceCents: training.outline_price_cents };

  const list = regs.map((r) => {
    const fees = computeFees(
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
    const name =
      `${r.first_name} ${r.last_name}` +
      (r.seat_type === "shared" ? ` + ${r.partner_first_name} ${r.partner_last_name}` : "");
    const langs =
      `${r.group_language.toUpperCase()} / ${r.outline_language.toUpperCase()}` +
      (r.second_outline_language ? ` + ${r.second_outline_language.toUpperCase()}` : "");
    return { r, fees, name, langs };
  });

  const sum = (pick: (row: (typeof list)[number]) => number) =>
    list.reduce((n, row) => n + pick(row), 0);
  const feesReceived = sum((x) => (x.r.fee_paid ? x.fees.trainingCents : 0));
  const outlinesReceived = sum((x) => (x.r.outline_paid ? x.fees.outlineCents : 0));
  const unpaid = sum(
    (x) => (x.r.fee_paid ? 0 : x.fees.trainingCents) + (x.r.outline_paid ? 0 : x.fees.outlineCents),
  );

  const needed = countOutlines(regs);
  const ordered = Object.fromEntries((orders ?? []).map((o) => [o.language, o.quantity]));
  const euro = (c: number) => formatEuro(c, locale);

  const feeToggle = (row: (typeof list)[number], visible?: boolean) =>
    row.fees.waived ? (
      <span className="inline-flex min-h-11 items-center text-sm text-muted">{t("waived")}</span>
    ) : (
      <PaymentToggle
        id={row.r.id}
        field="fee_paid"
        value={row.r.fee_paid}
        label={`${t("feePaid")}: ${row.name}`}
        visibleLabel={visible ? `${t("feePaid")} · ${euro(row.fees.trainingCents)}` : undefined}
        failedLabel={t("saveFailed")}
      />
    );
  const outlineToggle = (row: (typeof list)[number], visible?: boolean) => (
    <PaymentToggle
      id={row.r.id}
      field="outline_paid"
      value={row.r.outline_paid}
      label={`${t("outlinePaid")}: ${row.name}`}
      visibleLabel={visible ? `${t("outlinePaid")} · ${euro(row.fees.outlineCents)}` : undefined}
      failedLabel={t("saveFailed")}
    />
  );

  return (
    <div className="space-y-10">
      <LiveRefresh trainingId={training.id} />
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted">{localizedText.parse(training.title)[locale]}</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="min-h-11 text-sm underline">
            {t("signOut")}
          </button>
        </form>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t("seats")} value={String(regs.length)} />
        <Stat label={t("feesReceived")} value={euro(feesReceived)} />
        <Stat label={t("outlinesReceived")} value={euro(outlinesReceived)} />
        <Stat label={t("unpaid")} value={euro(unpaid)} />
      </dl>

      <section aria-labelledby="outlines-heading">
        <h2 id="outlines-heading" className="text-xl font-semibold">
          {t("outlineCounts")}
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full max-w-md text-left tabular-nums">
            <thead className="text-sm text-muted">
              <tr className="border-b border-line">
                <th scope="col" className="py-2 pr-3 font-normal">
                  {t("language")}
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-normal">
                  {t("needed")}
                </th>
                <th scope="col" className="py-2 pr-3 font-normal">
                  {t("ordered")}
                </th>
                <th scope="col" className="py-2 text-right font-normal">
                  {t("extra")}
                </th>
              </tr>
            </thead>
            <tbody>
              {languages.map((l) => {
                const extra = (ordered[l] ?? 0) - needed[l];
                return (
                  <tr key={l} className="border-b border-line">
                    <th scope="row" className="py-2 pr-3 font-normal">
                      {tl(l)}
                    </th>
                    <td className="py-2 pr-3 text-right">{needed[l]}</td>
                    <td className="py-2 pr-3">
                      <form action={setOutlineOrder} className="flex items-center gap-2">
                        <input type="hidden" name="training_id" value={training.id} />
                        <input type="hidden" name="language" value={l} />
                        <input
                          name="quantity"
                          type="number"
                          min={0}
                          defaultValue={ordered[l] ?? 0}
                          aria-label={t("orderedFor", { language: tl(l) })}
                          className="w-16 rounded-md border border-line-strong bg-background px-2 py-1.5"
                        />
                        <button
                          type="submit"
                          aria-label={`${t("save")}: ${t("orderedFor", { language: tl(l) })}`}
                          className="min-h-9 rounded-md border border-line-strong px-2 text-sm hover:bg-surface"
                        >
                          {t("save")}
                        </button>
                      </form>
                    </td>
                    <td
                      className={`py-2 text-right ${extra < 0 ? "font-semibold text-danger" : ""}`}
                    >
                      {extra < 0 ? t("shortBy", { count: -extra }) : extra}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="registrations-heading">
        <h2 id="registrations-heading" className="text-xl font-semibold">
          {t("registrations")}
        </h2>

        {/* Phones: one card per registration, payment toggles first-class. */}
        <ul className="mt-3 divide-y divide-line border-y border-line sm:hidden">
          {list.map((row) => (
            <li key={row.r.id} className="py-3">
              <p className="font-semibold">{row.name}</p>
              {row.r.payer_name && (
                <p className="text-sm">{t("payer", { name: row.r.payer_name })}</p>
              )}
              <p className="text-sm text-muted">
                {t(`seatShort.${row.r.seat_type}`)} · {row.langs}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-6">
                {feeToggle(row, true)}
                {outlineToggle(row, true)}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-3 hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr className="border-b border-line-strong">
                <th scope="col" className="py-2 pr-3 font-normal">
                  {t("name")}
                </th>
                <th scope="col" className="pr-3 font-normal">
                  {t("seat")}
                </th>
                <th scope="col" className="pr-3 font-normal">
                  {t("languages")}
                </th>
                <th scope="col" className="pr-3 font-normal">
                  {t("feePaid")}
                </th>
                <th scope="col" className="font-normal">
                  {t("outlinePaid")}
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.r.id} className="border-b border-line">
                  <th scope="row" className="py-1 pr-3 font-normal">
                    {row.name}
                    {row.r.payer_name && (
                      <span className="block text-xs text-muted">
                        {t("payer", { name: row.r.payer_name })}
                      </span>
                    )}
                  </th>
                  <td className="pr-3">{t(`seatShort.${row.r.seat_type}`)}</td>
                  <td className="pr-3 tabular-nums">{row.langs}</td>
                  <td className="pr-3">{feeToggle(row)}</td>
                  <td>{outlineToggle(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface p-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
