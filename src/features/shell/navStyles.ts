// Shared look of the header menu's links and the Mitglieder button: on
// phones a full-width row marked by a bar at its start, on wider screens a
// centred item underlined in the brand colour.
export const menuItemStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: { base: "space-between", md: "center" },
  gap: "1.5",
  w: { base: "full", md: "auto" },
  minH: "11",
  px: "3.5",
  fontSize: "md",
  fontWeight: "medium",
  textDecoration: "none",
  rounded: "l2",
  _hover: { color: "fg", bg: "bg.subtle" },
} as const;

export function currentStyle(current: boolean) {
  return current
    ? {
        color: "fg",
        rounded: "none",
        boxShadow: {
          base: "inset 3px 0 {colors.brand.solid}",
          md: "inset 0 -2px {colors.brand.solid}",
        },
      }
    : { color: { base: "fg", md: "fg.muted" } };
}

export function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
