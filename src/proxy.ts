import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { refreshSession } from "@/lib/supabase/proxy";

const intl = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const response = intl(request);
  if (request.nextUrl.pathname.includes("/coordinator")) {
    return refreshSession(request, response);
  }
  return response;
}

export const config = {
  // Payload's admin panel (/admin), every /api route, and Vercel BotID's proxy
  // endpoints stay outside locale routing.
  matcher: "/((?!api|admin|_next|_vercel|149e9513-01fa-4fb0-aad4-566afd725d1b|.*\\..*).*)",
};
