"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { saveMarks } from "@/lib/attendance";
import { requireSectionAuth } from "@/lib/auth";

const mark = z.enum(["present", "absent", "excused"]).nullable();
const changes = z.array(z.object({ registrationId: z.uuid(), sessionId: z.uuid(), mark })).max(500);

// Marks sent from a phone, possibly saved there while it was offline.
export async function saveAttendance(raw: unknown) {
  const supabase = await requireSectionAuth("attendance");
  await saveMarks(supabase, changes.parse(raw));
  refresh();
}

// One box of the attendance table.
export async function setAttendanceMark(
  rawRegistrationId: string,
  rawSessionId: string,
  rawMark: unknown,
) {
  const supabase = await requireSectionAuth("attendance");
  await saveMarks(
    supabase,
    changes.parse([{ registrationId: rawRegistrationId, sessionId: rawSessionId, mark: rawMark }]),
  );
  refresh();
}
