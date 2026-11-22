import type { CollectionConfig, TextFieldSingleValidation } from "payload";

import { revalidateAfterChange, revalidateAfterDelete } from "@/cms/revalidate";

const validateLink: TextFieldSingleValidation = (value) =>
  !value || /^https:\/\/\S+$/.test(value) || "Use a full web address that starts with https://";

// Dated events of the church, such as conferences, a baptism or a change of
// meeting time. Published events show on the site until the day they end.
// The weekly import from the announcement email adds them as drafts.
export const Events: CollectionConfig = {
  slug: "events",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "startsAt", "location", "_status"],
  },
  defaultSort: "-startsAt",
  versions: { drafts: true },
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
  fields: [
    { name: "title", type: "text", localized: true, required: true },
    {
      name: "startsAt",
      type: "date",
      required: true,
      index: true,
      admin: {
        position: "sidebar",
        date: { pickerAppearance: "dayAndTime", timeIntervals: 15 },
        description: "Date and time in Frankfurt.",
      },
    },
    {
      name: "endsAt",
      type: "date",
      admin: {
        position: "sidebar",
        date: { pickerAppearance: "dayAndTime", timeIntervals: 15 },
        description: "Optional. For an event over several days, its last day and time.",
      },
    },
    {
      name: "allDay",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "No set time: the event takes the whole day, or the days from start to end.",
      },
    },
    {
      name: "location",
      type: "text",
      localized: true,
      admin: { description: "Optional. Leave empty for the usual meeting place." },
    },
    {
      name: "details",
      type: "textarea",
      localized: true,
      admin: { description: "Optional. A few lines; line breaks are kept." },
    },
    {
      name: "link",
      type: "text",
      validate: validateLink,
      admin: { description: "Optional. A web address with more information or for registering." },
    },
    {
      name: "importKey",
      type: "text",
      index: true,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Set by the weekly import, so the same event is not added twice.",
      },
    },
  ],
};
