"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import type { FormState } from "@/features/coordinator/types";
import type { ActionState, CancelState } from "@/features/registration/types";
import { currentCoordinatorName, requireAuth } from "@/lib/auth";
import {
  coordinatorCancelRegistration,
  coordinatorSavePayment,
  coordinatorSendEditLink,
  coordinatorUpdateRegistration,
} from "@/lib/registrations";

const id = z.uuid();

// Marks the donation and the outlines as received (or not) and sets the waiver.
// Only the payments the form showed are touched: a waived donation and a seat
// without outlines keep what they had. A form rendered before someone else's
// change is refused, so it cannot undo that change.
export async function savePayment(
  rawId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const supabase = await requireAuth();
  const registrationId = id.parse(rawId);
  const result = await coordinatorSavePayment(supabase, registrationId, form);
  if (result.status === "saved" || result.status === "stale") refresh();
  return result;
}

// A coordinator changes a registration. The cutoffs do not apply, and the
// registrant is not emailed.
export async function saveRegistration(
  rawId: string,
  _prev: { status: string },
  form: FormData,
): Promise<ActionState> {
  const supabase = await requireAuth();
  const registrationId = id.parse(rawId);
  const result = await coordinatorUpdateRegistration(supabase, registrationId, form);
  if (result.status === "saved" || result.status === "stale") refresh();
  return result;
}

// Cancels on the registrant's behalf and tells them by email.
export async function cancelRegistration(rawId: string): Promise<CancelState> {
  const supabase = await requireAuth();
  const registrationId = id.parse(rawId);
  const result = await coordinatorCancelRegistration(supabase, registrationId);
  if (result.status === "cancelled") refresh();
  return result;
}

// Gives the registration a new edit link and emails it, in the language the
// person registered in. The old link stops working.
export async function sendEditLink(rawId: string): Promise<FormState> {
  const supabase = await requireAuth();
  const registrationId = id.parse(rawId);
  const actorName = await currentCoordinatorName(supabase);
  const result = await coordinatorSendEditLink(supabase, actorName, registrationId);
  if (result.status === "saved") refresh();
  return result;
}
