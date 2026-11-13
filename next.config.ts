import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
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
    ]),
  // German pages of the old WordPress site. Its English pages (/en/...)
  // already match the new addresses.
  redirects: () =>
    Promise.resolve([
      { source: "/fur-besucher", destination: "/de/fur-besucher", permanent: true },
      { source: "/unser-glaube", destination: "/de/unser-glaube", permanent: true },
    ]),
};

export default withPayload(withNextIntl(nextConfig));
