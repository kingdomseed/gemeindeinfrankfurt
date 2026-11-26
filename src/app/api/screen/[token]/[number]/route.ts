import { NextResponse } from "next/server";
import { z } from "zod";

import { loadSharedMessageVersion } from "@/lib/messages";

const messageNumber = z.coerce.number().int().positive();

// Public endpoint polled by open screen share links to detect live updates to
// hymns or verses without requiring a coordinator sign-in.
export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string; number: string }> },
) {
  const { token, number: rawNumber } = await context.params;
  const parsedNumber = messageNumber.safeParse(rawNumber);
  if (!parsedNumber.success) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const version = await loadSharedMessageVersion(token, parsedNumber.data);
  if (!version) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ version }, { headers: { "Cache-Control": "no-store" } });
}
