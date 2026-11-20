import type { ReactNode } from "react";

import type { NavPage } from "@/lib/cms";

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

// Header and footer shared by every page of the site. Each section brings
// its own <main>.
export function SiteShell(props: {
  siteName: string;
  tagline: string;
  pages: readonly NavPage[];
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader siteName={props.siteName} tagline={props.tagline} pages={props.pages} />
      {props.children}
      <SiteFooter siteName={props.siteName} />
    </>
  );
}
