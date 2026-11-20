import type { Block } from "payload";

// The sections an editor can stack on a page. Each one is drawn by a Chakra
// component in src/features/church, so editors choose content, not styling.

export const TextBlock: Block = {
  slug: "text",
  labels: { singular: "Text", plural: "Text" },
  fields: [{ name: "content", type: "richText", required: true }],
};

export const FaqBlock: Block = {
  slug: "faq",
  labels: { singular: "Questions and answers", plural: "Questions and answers" },
  fields: [
    {
      name: "items",
      type: "array",
      required: true,
      labels: { singular: "Question", plural: "Questions" },
      admin: { initCollapsed: true },
      fields: [
        { name: "question", type: "text", required: true },
        { name: "answer", type: "richText", required: true },
      ],
    },
  ],
};

export const StatementsBlock: Block = {
  slug: "statements",
  labels: { singular: "Statements with Bible references", plural: "Statements" },
  fields: [
    {
      name: "items",
      type: "array",
      required: true,
      labels: { singular: "Statement", plural: "Statements" },
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "text", type: "textarea", required: true },
        { name: "references", type: "text", admin: { description: "For example: Joh. 1:1, 14" } },
      ],
    },
  ],
};

export const MeetingPlaceBlock: Block = {
  slug: "meetingPlace",
  labels: { singular: "Meeting place", plural: "Meeting place" },
  fields: [
    {
      name: "heading",
      type: "text",
      admin: { description: "The address itself comes from Site Settings." },
    },
  ],
};

export const AnnouncementsBlock: Block = {
  slug: "announcements",
  labels: { singular: "Latest announcements", plural: "Latest announcements" },
  fields: [
    { name: "heading", type: "text" },
    {
      name: "limit",
      type: "number",
      defaultValue: 3,
      min: 1,
      max: 10,
      admin: { description: "How many announcements to show, newest first." },
    },
  ],
};

export const pageBlocks = [
  TextBlock,
  FaqBlock,
  StatementsBlock,
  MeetingPlaceBlock,
  AnnouncementsBlock,
];
