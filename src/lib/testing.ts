import "server-only";
import type { CoordinatorClient } from "@/lib/auth";

export type TestRow = {
  sessionId: string;
  messageNumber: number;
  startsAt: string;
  // The group that tests before this message, or null for no test.
  groupId: string | null;
};

// The messages that start with a test, each with the group planned for it.
export async function loadTestSchedule(
  supabase: CoordinatorClient,
  trainingId: string,
): Promise<TestRow[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("id, message_number, starts_at, test_slots(group_id)")
    .eq("training_id", trainingId)
    .eq("is_tested", true)
    .order("message_number");
  if (error) throw error;
  return data.map((s) => ({
    sessionId: s.id,
    messageNumber: s.message_number,
    startsAt: s.starts_at,
    groupId: s.test_slots?.group_id ?? null,
  }));
}

// Plans a group's test before a message, or takes the test away.
export async function setTestGroup(
  supabase: CoordinatorClient,
  sessionId: string,
  groupId: string | null,
) {
  const { error } = groupId
    ? await supabase
        .from("test_slots")
        .upsert({ session_id: sessionId, group_id: groupId }, { onConflict: "session_id" })
    : await supabase.from("test_slots").delete().eq("session_id", sessionId);
  if (error) throw error;
}
