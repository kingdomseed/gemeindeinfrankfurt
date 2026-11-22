import { Link } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

import { StatusTag } from "@/components/ui/status-tag";
import { Link as LocaleLink } from "@/i18n/navigation";

import { detailHref, displayName } from "./display";
import type { RegistrationRow } from "./types";

// The registrant's name as the link to their registration, with a tag when it
// is cancelled.
export function RegistrationName({ row }: { row: RegistrationRow }) {
  const t = useTranslations("coordinator");
  const r = row.registration;
  return (
    <>
      <Link asChild fontWeight="semibold" textDecoration="underline" color="fg">
        <LocaleLink href={detailHref(r.id)}>{displayName(r)}</LocaleLink>
      </Link>
      {row.duplicate && (
        <StatusTag tone="warning" ms="2">
          {t("possibleDuplicate")}
        </StatusTag>
      )}
      {r.status === "cancelled" && (
        <StatusTag tone="error" ms="2">
          {t("cancelledTag")}
        </StatusTag>
      )}
    </>
  );
}
