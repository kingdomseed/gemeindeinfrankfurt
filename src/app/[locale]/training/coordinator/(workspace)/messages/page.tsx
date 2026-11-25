import { getTranslations } from "next-intl/server";

import { PageMessage } from "@/components/ui/page-message";
import { messageHref } from "@/features/coordinator/sections";
import { requireLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { currentSession } from "@/lib/domain/attendance";

import { requireActiveWorkspace } from "../workspace";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/messages">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator.messages" });
  return { title: t("title") };
}

// Opens the message that is on now or next.
export default async function MessagesPage({ params }: Props) {
  const ws = await requireActiveWorkspace((await params).locale);
  if (!ws.ok) return ws.fallback;
  const { locale, data, now } = ws.workspace;
  const session = currentSession(data.training.sessions, now);
  if (!session) {
    const th = await getTranslations("home");
    return <PageMessage title={th("noTraining")} />;
  }
  return redirect({ href: messageHref(session.message_number), locale });
}
