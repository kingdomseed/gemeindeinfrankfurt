import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageMessage } from "@/components/ui/page-message";
import { MainColumn } from "@/features/shell/MainColumn";
import { requireLocale } from "@/i18n/locale";
import { redirect } from "@/i18n/navigation";
import { currentSession } from "@/lib/domain/attendance";
import { loadSharedTrainingByToken } from "@/lib/messages";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/screen/[token]">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator.messages" });
  return {
    title: t("title"),
    robots: { index: false, follow: false },
  };
}

// Entry point for a room's live screen link: opens the message on now or next.
export default async function SharedScreenIndexPage({ params }: Props) {
  const { locale: raw, token } = await params;
  const locale = requireLocale(raw);
  setRequestLocale(locale);

  const [t, shared] = await Promise.all([
    getTranslations("coordinator.screen"),
    loadSharedTrainingByToken(token),
  ]);
  if (!shared) {
    return (
      <MainColumn>
        <PageMessage title={t("invalidLink")} body={t("invalidLinkBody")} />
      </MainColumn>
    );
  }

  const session = currentSession(
    shared.sessions.map((s) => ({
      id: s.sessionId,
      message_number: s.messageNumber,
      starts_at: s.startsAt,
      ends_at: s.endsAt,
    })),
    new Date(),
  );
  if (!session) {
    return (
      <MainColumn>
        <PageMessage title={t("nothing")} />
      </MainColumn>
    );
  }
  return redirect({ href: `/training/screen/${token}/${session.message_number}`, locale });
}
