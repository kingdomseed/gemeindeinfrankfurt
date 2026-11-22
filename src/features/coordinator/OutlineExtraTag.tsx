import { useTranslations } from "next-intl";

import { StatusTag } from "@/components/ui/status-tag";

// Ordered outlines beyond what is needed, or how many are missing.
export function OutlineExtraTag({ extra }: { extra: number }) {
  const t = useTranslations("coordinator");
  if (extra < 0) return <StatusTag tone="error">{t("shortBy", { count: -extra })}</StatusTag>;
  return <StatusTag tone={extra > 0 ? "success" : "neutral"}>{`+${extra}`}</StatusTag>;
}
