import { withPayload } from "@payloadcms/next/withPayload";
import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Static photo imports live alongside components; cap widths at 1920 to match
  // our 1600–2000px originals, prefer AVIF, and cache optimized variants longer.
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 2678400,
  },
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
