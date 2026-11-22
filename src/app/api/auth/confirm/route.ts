import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

// The sign-in email links here, so the link a coordinator sees is on this site
// rather than on the database host. The token is checked once, then the
// coordinator goes on to the page they asked for.
const params = z.object({
  token_hash: z.string().min(1),
  type: z.enum(["email", "magiclink"]),
});

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"), url.origin);
  const parsed = params.safeParse(Object.fromEntries(url.searchParams));
  if (parsed.success) {
    const supabase = await createClient();
    await supabase.auth.verifyOtp({ type: parsed.data.type, token_hash: parsed.data.token_hash });
  }
  // react-doctor-disable-next-line react-doctor/clickjacking-redirect-risk -- safeNext allows only this site's coordinator pages, and next.config.ts forbids framing.
  return NextResponse.redirect(next);
}
