import { NextResponse, type NextRequest } from "next/server";

import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"), url.origin);

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  // react-doctor-disable-next-line react-doctor/clickjacking-redirect-risk -- safeNext allows only this site's coordinator pages, and next.config.ts forbids framing.
  return NextResponse.redirect(next);
}
