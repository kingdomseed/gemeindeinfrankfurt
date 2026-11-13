import config from "@payload-config";
// oxlint-disable-next-line import/no-unassigned-import -- Payload's admin stylesheet; the package export has no .css extension.
import "@payloadcms/next/css";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import type { ServerFunctionArgs } from "payload";
import type { ReactNode } from "react";

import { importMap } from "./admin/importMap";

// Root layout of the Payload admin panel (/admin), set up as in Payload's
// blank template. The public site has its own root layout in [locale].
async function serverFunction(args: ServerFunctionArgs) {
  "use server";
  const result: unknown = await handleServerFunctions({ ...args, config, importMap });
  return result;
}

export default function PayloadLayout({ children }: { children: ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}
