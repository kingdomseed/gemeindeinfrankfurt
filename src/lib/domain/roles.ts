import { spaceSections, type SectionKey } from "./links";

export const coordinatorRoles = ["admin", "coordinator", "helper"] as const;
export type CoordinatorRole = (typeof coordinatorRoles)[number];

export const configurableRoles = ["coordinator", "helper"] as const;
export type ConfigurableRole = (typeof configurableRoles)[number];

export type RoleTabPermissions = Readonly<Record<ConfigurableRole, readonly SectionKey[]>>;

export const defaultRoleTabPermissions: RoleTabPermissions = {
  coordinator: spaceSections,
  helper: ["messages"],
};

// Maps a raw database/form string to a valid CoordinatorRole, defaulting to "coordinator".
export function parseCoordinatorRole(raw: unknown): CoordinatorRole {
  return coordinatorRoles.find((r) => r === raw) ?? "coordinator";
}

// Resolves a row's stored role while honoring legacy is_admin if set.
export function resolveCoordinatorRole(rawRole: unknown, isAdmin: boolean): CoordinatorRole {
  if (isAdmin) return "admin";
  return parseCoordinatorRole(rawRole);
}

// Filters to valid SectionKeys and sorts them in the canonical workspace nav order.
export function normalizeSectionList(tabs: readonly string[]): SectionKey[] {
  const allowed = new Set(tabs);
  return spaceSections.filter((s) => allowed.has(s));
}

// Admins always have access to every section so they cannot lock themselves out.
export function allowedSectionsForRole(
  role: CoordinatorRole,
  permissions: RoleTabPermissions,
): readonly SectionKey[] {
  if (role === "admin") return spaceSections;
  return normalizeSectionList(permissions[role]);
}

export function canAccessSection(
  role: CoordinatorRole,
  permissions: RoleTabPermissions,
  section: SectionKey,
): boolean {
  if (role === "admin") return true;
  return permissions[role].includes(section);
}

export function firstAllowedSection(
  role: CoordinatorRole,
  permissions: RoleTabPermissions,
): SectionKey | null {
  return allowedSectionsForRole(role, permissions)[0] ?? null;
}
