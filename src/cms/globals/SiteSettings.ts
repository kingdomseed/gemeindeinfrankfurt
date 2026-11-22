import type { GlobalConfig } from "payload";

import { revalidateGlobalAfterChange } from "@/cms/revalidate";

// Header, contact panel and footer text shared by every public page.
export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [
    { name: "siteName", type: "text", localized: true, required: true },
    { name: "tagline", type: "text", localized: true },
    { name: "contactHeading", type: "text", localized: true },
    { name: "contactIntro", type: "textarea", localized: true },
    { name: "meetingAddress", type: "text", required: true },
    {
      name: "contactEmail",
      type: "email",
      admin: { description: "Shown in the contact panel. Leave empty to hide the email link." },
    },
    {
      name: "meetingLink",
      type: "text",
      admin: {
        description:
          "Zoom link for the meetings. Shown only on the announcements page, which search engines are told not to index.",
      },
      validate: (value: string | null | undefined) =>
        !value || URL.canParse(value) || "Enter the full link, starting with https://",
    },
  ],
};
