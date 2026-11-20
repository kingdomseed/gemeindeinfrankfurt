import "server-only";
import { tokens } from "@/theme/tokens";

// The confirmation email as HTML, after the EmailConfirmation board. Email
// clients ignore stylesheets, so styles are inline, but every colour comes
// from the theme tokens: a theme change reaches the email too.
const c = {
  page: tokens.colors.surface.light.value,
  card: tokens.colors.paper.light.value,
  ink: tokens.colors.ink.light.value,
  muted: tokens.colors.muted.light.value,
  line: tokens.colors.line.strongLight.value,
  brand: tokens.colors.teal.light.value,
  brandInk: tokens.colors.teal.inkLight.value,
  brandSoft: tokens.colors.teal.softLight.value,
};
// Single quotes, because the font list sits inside a style="…" attribute.
const font = tokens.fonts.body.value.replaceAll('"', "'");

export type ConfirmationEmail = {
  lang: string;
  brand: string;
  heading: string;
  intro: string;
  details: readonly { label: string; value: string }[];
  transfer: {
    title: string;
    lines: readonly { label: string; value: string }[];
    account: readonly { label: string; value: string }[];
  } | null;
  calendar: { label: string; url: string };
  change: { intro: string; label: string; url: string; note: string };
  footer: string;
};

function escape(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function rows(items: readonly { label: string; value: string }[], mono = false): string {
  return items
    .map(
      (i) =>
        `<tr><td style="padding:4px 24px 4px 0;color:${c.muted};vertical-align:top;white-space:nowrap">${escape(i.label)}</td>` +
        `<td style="padding:4px 0;${mono ? "font-family:monospace;" : ""}">${escape(i.value)}</td></tr>`,
    )
    .join("");
}

function button(label: string, url: string, solid: boolean): string {
  const style = solid
    ? `background:${c.brand};color:${c.brandInk};border:1px solid ${c.brand}`
    : `background:${c.card};color:${c.ink};border:1px solid ${c.line}`;
  return `<a href="${escape(url)}" style="${style};display:inline-block;padding:10px 24px;border-radius:4px;font-weight:500;text-decoration:none">${escape(label)}</a>`;
}

export function confirmationHtml(e: ConfirmationEmail): string {
  const transfer = e.transfer
    ? `<div style="background:${c.brandSoft};border-radius:12px;padding:20px;margin:0 0 24px">
<p style="margin:0 0 12px;font-size:18px;font-weight:600">${escape(e.transfer.title)}</p>
<table role="presentation" style="width:100%;border-collapse:collapse">${e.transfer.lines
        .map(
          (l) =>
            `<tr><td style="padding:3px 0">${escape(l.label)}</td><td style="padding:3px 0;text-align:right">${escape(l.value)}</td></tr>`,
        )
        .join("")}</table>
<table role="presentation" style="width:100%;margin-top:8px;border-top:1px solid ${c.line};border-collapse:collapse">${rows(e.transfer.account, true)}</table>
</div>`
    : "";
  return `<!doctype html>
<html lang="${escape(e.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:${c.page};color:${c.ink};font-family:${font};font-size:16px;line-height:24px">
<div style="max-width:632px;margin:0 auto;padding:24px">
<div style="background:${c.card};border-radius:8px;padding:32px">
<p style="margin:0 0 24px;font-weight:600">${escape(e.brand)}</p>
<h1 style="margin:0 0 8px;font-size:20px;line-height:30px;font-weight:600">${escape(e.heading)}</h1>
<p style="margin:0 0 24px">${escape(e.intro)}</p>
<table role="presentation" style="border-collapse:collapse;margin:0 0 24px">${rows(e.details)}</table>
${transfer}
<p style="margin:0 0 24px">${button(e.calendar.label, e.calendar.url, false)}</p>
<p style="margin:0 0 12px">${escape(e.change.intro)}</p>
<p style="margin:0 0 12px">${button(e.change.label, e.change.url, true)}</p>
<p style="margin:0 0 24px;font-size:14px;line-height:20px;color:${c.muted}">${escape(e.change.note)}</p>
<hr style="border:0;border-top:1px solid ${c.line};margin:0 0 16px">
<p style="margin:0;font-size:14px;line-height:20px;color:${c.muted}">${escape(e.footer)}</p>
</div></div></body></html>`;
}
