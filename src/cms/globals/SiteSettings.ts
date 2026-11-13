import type { GlobalConfig } from "payload";

// Header, contact panel and footer text shared by every public page.
export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
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
  ],
};
