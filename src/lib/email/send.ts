import "server-only";
import type { Training, TrainingWithSessions } from "@/lib/data";
import type { Language } from "@/lib/domain/types";
import type { RegistrationInput } from "@/lib/registrations";

import { composeCancellation, composeConfirmation, type ConfirmationRegistration } from "./compose";
import { createEmailDelivery, createResendTransport, type MailMessage } from "./transport";

export type { MailMessage as OutgoingEmail } from "./transport";

function deliveryFromEnv() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("Missing environment variable EMAIL_FROM");
  return createEmailDelivery(
    createResendTransport({
      apiKey,
      from,
      replyTo: process.env.EMAIL_REPLY_TO,
    }),
  );
}

export function confirmationFromInput(
  input: RegistrationInput,
  waived: boolean,
): ConfirmationRegistration {
  return {
    firstName: input.first_name,
    email: input.email,
    seatType: input.seat_type,
    localityId: input.locality_id,
    otherLocality: input.other_locality,
    siteId: input.site_id,
    groupLanguage: input.group_language,
    outlineLanguage: input.outline_language,
    secondOutlineLanguage: input.second_outline_language,
    sessionIds: input.session_ids,
    waived,
  };
}

export async function sendBatch(
  emails: readonly MailMessage[],
  batchPrefix = "batch",
): Promise<{ sent: number; error: Error | null }> {
  const delivery = deliveryFromEnv();
  if (!delivery) {
    // Local development without an email provider.
    console.warn(`[email skipped: RESEND_API_KEY not set] ${emails.length} emails`);
    return { sent: 0, error: null };
  }
  return delivery.sendBatch(emails, batchPrefix);
}

export async function sendConfirmation(opts: {
  locale: Language;
  training: TrainingWithSessions;
  registration: ConfirmationRegistration;
  registrationId: string;
  token: string;
}): Promise<void> {
  const message = composeConfirmation({
    ...opts,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  });
  const delivery = deliveryFromEnv();
  if (!delivery) {
    console.warn(`[email skipped: RESEND_API_KEY not set] ${message.subject}`);
    return;
  }
  await delivery.sendOne(message);
}

export async function sendCancellation(opts: {
  locale: Language;
  training: Training;
  registrationId: string;
  email: string;
  firstName: string;
}): Promise<void> {
  const message = composeCancellation(opts);
  const delivery = deliveryFromEnv();
  if (!delivery) {
    console.warn(`[email skipped: RESEND_API_KEY not set] ${message.subject}`);
    return;
  }
  await delivery.sendOne(message);
}
