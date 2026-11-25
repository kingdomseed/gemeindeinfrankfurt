import { withPayload } from "@payloadcms/next/withPayload";
import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // `next upgrade --agent` and the upgrade reminders follow security advisories.
  // Invoice photos for the report are sent through a server action; the
  // browser shrinks them first, so 4 MB leaves room.
  experimental: { agentUpgrade: "security", serverActions: { bodySizeLimit: "4mb" } },
  // No page of this site may be framed by another site (clickjacking).
  headers: () =>
    Promise.resolve([
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
      // The announcements carry the meeting link; they stay out of search engines.
      ...["/announcements", "/:locale/announcements"].map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      })),
    ]),
};

export default withBotId(withPayload(withNextIntl(nextConfig)));
