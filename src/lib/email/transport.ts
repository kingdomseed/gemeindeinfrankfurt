import "server-only";
import { createHash } from "node:crypto";

import { Resend } from "resend";
import { z } from "zod";

export const BATCH_LIMIT = 100;
export const MAX_IDEMPOTENCY_KEY_LENGTH = 256;

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string | undefined;
  idempotencyKey?: string | undefined;
};

export type MailTransport = {
  send(message: MailMessage): Promise<{ error: Error | null }>;
  sendBatch(
    messages: readonly MailMessage[],
    idempotencyKey: string,
  ): Promise<{ error: Error | null }>;
};

const emailAddress = z.email().max(200);

export function validateMailMessage(message: MailMessage): string | null {
  if (!emailAddress.safeParse(message.to).success) return "invalid recipient email";
  if (message.subject.trim().length === 0) return "empty subject";
  if (message.text.trim().length === 0) return "empty text body";
  if (
    message.idempotencyKey !== undefined &&
    (message.idempotencyKey.length === 0 ||
      message.idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH)
  ) {
    return "invalid idempotency key length";
  }
  return null;
}

export function deterministicIdempotencyKey(prefix: string, parts: readonly string[]): string {
  const hash = createHash("sha256").update(JSON.stringify(parts)).digest("hex");
  return `${prefix}/${hash}`;
}

export function createEmailDelivery(transport: MailTransport) {
  return {
    async sendOne(message: MailMessage): Promise<void> {
      const invalid = validateMailMessage(message);
      if (invalid) throw new Error(`Invalid email: ${invalid}`);
      const idempotencyKey =
        message.idempotencyKey ??
        deterministicIdempotencyKey("email", [
          message.to,
          message.subject,
          message.text,
          message.html ?? "",
        ]);
      const { error } = await transport.send({ ...message, idempotencyKey });
      if (error) throw new Error(`Email failed: ${error.message}`);
    },

    // Resend's batch endpoint is atomic (one invalid item rejects the whole
    // chunk), so validate every message before sending chunk 1.
    async sendBatch(
      messages: readonly MailMessage[],
      batchPrefix = "batch",
    ): Promise<{ sent: number; error: Error | null }> {
      if (messages.length === 0) return { sent: 0, error: null };
      for (const [index, message] of messages.entries()) {
        const invalid = validateMailMessage(message);
        if (invalid) {
          return { sent: 0, error: new Error(`Invalid email at index ${index}: ${invalid}`) };
        }
      }
      let sent = 0;
      for (let i = 0; i < messages.length; i += BATCH_LIMIT) {
        const chunk = messages.slice(i, i + BATCH_LIMIT);
        const idempotencyKey = deterministicIdempotencyKey(
          batchPrefix,
          chunk.map((m) => JSON.stringify([m.to, m.subject, m.text, m.html ?? ""])),
        );
        // oxlint-disable-next-line no-await-in-loop, react-doctor/async-await-in-loop -- sequential chunks stay under Resend's 10 req/s rate limit
        const { error } = await transport.sendBatch(chunk, idempotencyKey);
        if (error) return { sent, error };
        sent += chunk.length;
      }
      return { sent, error: null };
    },
  };
}

export function createResendTransport(opts: {
  apiKey: string;
  from: string;
  replyTo?: string | undefined;
}): MailTransport {
  const resend = new Resend(opts.apiKey);
  const toPayload = (m: MailMessage) => ({
    from: opts.from,
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    to: m.to,
    subject: m.subject,
    text: m.text,
    ...(m.html ? { html: m.html } : {}),
  });

  return {
    async send(message) {
      const { error } = await resend.emails.send(
        toPayload(message),
        message.idempotencyKey ? { idempotencyKey: message.idempotencyKey } : undefined,
      );
      return { error: error ? new Error(error.message) : null };
    },

    async sendBatch(messages, idempotencyKey) {
      const { error } = await resend.batch.send(messages.map(toPayload), { idempotencyKey });
      return { error: error ? new Error(error.message) : null };
    },
  };
}
