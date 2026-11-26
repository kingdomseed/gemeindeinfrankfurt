import { getFormatter, getTranslations } from "next-intl/server";

import { EmailsWorkspace } from "@/features/coordinator/EmailsWorkspace";
import { requireLocale } from "@/i18n/locale";
import { BERLIN_TIME_ZONE } from "@/lib/domain/berlin-time";
import { beforeTrainingDue, countByLocale, inAudience, type Audience } from "@/lib/domain/emails";
import { berlinDay } from "@/lib/domain/sessions";
import { loadRecipients, loadSentEmails } from "@/lib/emails";
import { loadStudyGroups } from "@/lib/groups";

import { requireActiveWorkspace } from "../workspace";
import { sendBeforeTraining, sendMessage, sendPaymentReminder } from "./actions";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[locale]/training/coordinator/emails">;

export async function generateMetadata({ params }: Props) {
  const locale = requireLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "coordinator.emails" });
  return { title: t("title") };
}

export default async function EmailsPage({ params }: Props) {
  const ws = await requireActiveWorkspace((await params).locale, "emails");
  if (!ws.ok) return ws.fallback;
  const { locale, data, supabase, now } = ws.workspace;
  const [t, tg, th, tl, format] = await Promise.all([
    getTranslations("coordinator.emails"),
    getTranslations("coordinator.groups"),
    getTranslations("home"),
    getTranslations("common.languages"),
    getFormatter(),
  ]);
  const { training } = data;

  const [recipients, sent, groups] = await Promise.all([
    loadRecipients(supabase, training.id, {
      feeCents: training.fee_cents,
      outlinePriceCents: training.outline_price_cents,
    }),
    loadSentEmails(supabase, training.id),
    loadStudyGroups(supabase, training.id),
  ]);
  const when = (iso: string) =>
    format.dateTime(new Date(iso), {
      timeZone: BERLIN_TIME_ZONE,
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const firstStart = training.sessions
    .map((s) => Date.parse(s.starts_at))
    .toSorted((a, b) => a - b)[0];
  const due = firstStart === undefined ? null : beforeTrainingDue(new Date(firstStart));
  const lastBefore = sent.find((s) => s.kind === "before_training");
  let before = null;
  if (lastBefore) {
    before = {
      tone: "success" as const,
      label: t("sentOn", { date: when(lastBefore.sentAt), count: lastBefore.count }),
    };
  } else if (due) {
    before = {
      tone: due.getTime() <= now.getTime() ? ("warning" as const) : ("neutral" as const),
      label: t("dueOn", { date: berlinDay(due, locale, th("lordsDay")) }),
    };
  }

  const audience = (value: Audience, label: string) => {
    const members = recipients.filter((r) => inAudience(r, value));
    return { value, label, count: members.length, byLocale: countByLocale(members) };
  };

  return (
    <EmailsWorkspace
      unpaid={recipients.filter((r) => r.openCents > 0).length}
      registered={recipients.length}
      before={before}
      audiences={[
        audience("everyone", t("everyone")),
        audience("unpaid", t("unpaid")),
        ...groups.map((g) =>
          audience(
            `group:${g.id}`,
            `${tg("groupNumber", { number: g.number })} · ${tl(g.language)}`,
          ),
        ),
        audience("part_time", t("partTime")),
      ]}
      sent={sent.map((s) => ({
        id: s.id,
        when: when(s.sentAt),
        line: t("sentLine", { kind: t(`sentKind.${s.kind}`), subject: s.subject, by: s.sentBy }),
        count: s.count,
      }))}
      actions={{
        reminder: sendPaymentReminder.bind(null, training.id),
        before: sendBeforeTraining.bind(null, training.id),
        message: sendMessage.bind(null, training.id),
      }}
    />
  );
}
