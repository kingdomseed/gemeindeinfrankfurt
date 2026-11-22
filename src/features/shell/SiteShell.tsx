import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { SkipLink } from "@/components/ui/skip-link";
import type { NavPage, SiteSettings } from "@/lib/cms";
import type { TrainingWithSessions } from "@/lib/data";

import { RegistrationBanner } from "./RegistrationBanner";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

// Skip link, training banner, header and footer shared by every page of the
// site. Each section brings its own <main>.
export function SiteShell(props: {
  settings: SiteSettings;
  pages: readonly NavPage[];
  training: TrainingWithSessions | null;
  children: ReactNode;
}) {
  const t = useTranslations("site");
  return (
    <>
      <SkipLink label={t("skipToContent")} />
      {props.training && <RegistrationBanner training={props.training} />}
      <SiteHeader siteName={props.settings.siteName} pages={props.pages} />
      {props.children}
      <SiteFooter settings={props.settings} pages={props.pages} />
    </>
  );
}
