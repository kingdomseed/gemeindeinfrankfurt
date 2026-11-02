import { setRequestLocale } from "next-intl/server";

import { PageMessage } from "@/components/ui/page-message";
import { CoordinatorDashboard } from "@/features/coordinator/CoordinatorDashboard";
import { LiveRefresh } from "@/features/coordinator/LiveRefresh";
import { requireLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { getCoordinatorClient } from "@/lib/auth";
import { loadCoordinatorDashboard } from "@/lib/coordinator";

import { setOutlineOrder, setPaymentFlag, signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function CoordinatorPage({ params }: PageProps<"/[locale]/coordinator">) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const supabase = await getCoordinatorClient();
  if (!supabase) return redirect({ href: "/coordinator/login", locale });

  const data = await loadCoordinatorDashboard(supabase);
  if (!data) return <PageMessage>—</PageMessage>;

  return (
    <>
      <LiveRefresh trainingId={data.training.id} />
      <CoordinatorDashboard
        data={data}
        actions={{ signOut, saveOutlineOrder: setOutlineOrder, setPaymentFlag }}
      />
    </>
  );
}
