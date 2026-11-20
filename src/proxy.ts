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
  // Payload's admin panel (/admin) and every /api route stay outside locale routing.
  matcher: "/((?!api|admin|_next|_vercel|.*\\..*).*)",
};
