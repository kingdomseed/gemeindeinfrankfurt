import "server-only";
import { z } from "zod";

import type { Mark } from "@/lib/domain/attendance";
import type { createClient } from "@/lib/supabase/server";

type CoordinatorClient = Awaited<ReturnType<typeof createClient>>;

// "registrationId:sessionId" for one box of the attendance table.
export function markKey(registrationId: string, sessionId: string) {
  return `${registrationId}:${sessionId}`;
}

// Every present, absent or excused mark of a training, by markKey.
export async function loadAttendance(
  supabase: CoordinatorClient,
  trainingId: string,
): Promise<Record<string, Mark>> {
  const { data, error } = await supabase
    .from("attendance")
    .select("registration_id, session_id, mark, sessions!inner(training_id)")
    .eq("sessions.training_id", trainingId)
    .in("mark", ["present", "absent", "excused"]);
  if (error) throw error;
  const mark = z.enum(["present", "absent", "excused"]);
  return Object.fromEntries(
    data.map((a) => [markKey(a.registration_id, a.session_id), mark.parse(a.mark)]),
  );
}

export type MarkChange = { registrationId: string; sessionId: string; mark: Mark | null };

// Saves marks; a null mark clears the box. Recorded under the signed-in coordinator.
export async function saveMarks(supabase: CoordinatorClient, changes: readonly MarkChange[]) {
  const { data: auth } = await supabase.auth.getUser();
  const set = changes.flatMap((c) =>
    c.mark
      ? [
          {
            registration_id: c.registrationId,
            session_id: c.sessionId,
            mark: c.mark,
            recorded_by: auth.user?.id ?? null,
            recorded_at: new Date().toISOString(),
          },
        ]
      : [],
  );
  const cleared = changes.filter((c) => c.mark === null);
  const results = await Promise.all([
    set.length > 0
      ? supabase.from("attendance").upsert(set, { onConflict: "registration_id,session_id" })
      : null,
    ...cleared.map((c) =>
      supabase
        .from("attendance")
        .delete()
        .eq("registration_id", c.registrationId)
        .eq("session_id", c.sessionId),
    ),
  ]);
  const failed = results.find((r) => r?.error);
  if (failed?.error) throw failed.error;
}
