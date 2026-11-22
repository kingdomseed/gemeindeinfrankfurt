import { useLocale } from "next-intl";

import type { TrainingWithSessions } from "@/lib/data";
import { canRegister, computeCutoffs } from "@/lib/domain/cutoffs";
import { berlinDate, trainingDateSpan } from "@/lib/domain/sessions";

import { dismissKey, hiddenAttribute } from "./bannerStorage";
import { RegistrationBar } from "./RegistrationBar";

// The quiet strip above the header while registration for a training is open.
// Pages are cached, so before the page is painted a small script hides it
// once registration has closed, or when this visitor has dismissed it.
export function RegistrationBanner({ training }: { training: TrainingWithSessions }) {
  const locale = useLocale();
  const cutoffs = computeCutoffs(training.sessions);
  const dates = trainingDateSpan(training.sessions, locale);
  if (!cutoffs || !dates || !canRegister(training.sessions)) return null;
  const config = JSON.stringify({
    key: dismissKey(training.id),
    closesAt: cutoffs.registrationClosesAt.getTime(),
    attribute: hiddenAttribute,
  }).replaceAll("<", "\\u003c");
  const script = `try{var c=${config};if(Date.now()>=c.closesAt||localStorage.getItem(c.key))document.documentElement.setAttribute(c.attribute,"")}catch(e){}`;
  return (
    <>
      {/* oxlint-disable-next-line react/no-danger -- a fixed script built from our own data must run before paint, so dismissed visitors never see the bar flash */}
      <script dangerouslySetInnerHTML={{ __html: script }} />
      <RegistrationBar
        storageKey={dismissKey(training.id)}
        dates={dates}
        closesDay={berlinDate(cutoffs.registrationClosesAt, locale)}
      />
    </>
  );
}
