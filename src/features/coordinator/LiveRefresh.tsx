"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/browser";

// Re-renders the page when another coordinator changes a registration, a
// group, a test, a service lead, an attendance mark, a message's hymns and
// verses, or the report and its costs. Tables that carry the training's id are filtered by it; the others
// only point to such a row.
export function LiveRefresh({ trainingId }: { trainingId: string }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    const refresh = () => router.refresh();
    const filter = `training_id=eq.${trainingId}`;
    const channel = supabase
      .channel(`coordination:${trainingId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "registrations", filter },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "study_groups", filter },
        refresh,
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "services", filter }, refresh)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "training_reports", filter },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reimbursements", filter },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "study_group_members" },
        refresh,
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "test_slots" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_hymns" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_verses" }, refresh)
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, trainingId]);
  return null;
}
