import { describe, expect, it } from "vitest";

import { spaceSections } from "./links";
import {
  allowedSectionsForRole,
  canAccessSection,
  defaultRoleTabPermissions,
  firstAllowedSection,
  normalizeSectionList,
  parseCoordinatorRole,
  resolveCoordinatorRole,
} from "./roles";

describe("coordinator roles and tab permissions", () => {
  it("parses known roles and falls back to coordinator", () => {
    expect(parseCoordinatorRole("admin")).toBe("admin");
    expect(parseCoordinatorRole("coordinator")).toBe("coordinator");
    expect(parseCoordinatorRole("helper")).toBe("helper");
    expect(parseCoordinatorRole("unknown")).toBe("coordinator");
    expect(parseCoordinatorRole(null)).toBe("coordinator");
    expect(resolveCoordinatorRole("helper", true)).toBe("admin");
    expect(resolveCoordinatorRole("helper", false)).toBe("helper");
  });

  it("normalizes section lists in canonical order, stripping duplicates and unknown keys", () => {
    expect(normalizeSectionList(["setup", "bogus", "messages", "setup"])).toEqual([
      "messages",
      "setup",
    ]);
  });

  it("grants admins every section regardless of configured permissions", () => {
    const restricted = { coordinator: [], helper: [] };
    expect(allowedSectionsForRole("admin", restricted)).toEqual(spaceSections);
    expect(canAccessSection("admin", restricted, "setup")).toBe(true);
    expect(firstAllowedSection("admin", restricted)).toBe("overview");
  });

  it("defaults helper to messages only and coordinator to all sections", () => {
    expect(allowedSectionsForRole("helper", defaultRoleTabPermissions)).toEqual(["messages"]);
    expect(canAccessSection("helper", defaultRoleTabPermissions, "messages")).toBe(true);
    expect(canAccessSection("helper", defaultRoleTabPermissions, "overview")).toBe(false);
    expect(firstAllowedSection("helper", defaultRoleTabPermissions)).toBe("messages");
    expect(allowedSectionsForRole("coordinator", defaultRoleTabPermissions)).toEqual(spaceSections);
  });

  it("returns null when a role has zero allowed sections", () => {
    const perms = { coordinator: ["overview"] as const, helper: [] as const };
    expect(firstAllowedSection("helper", perms)).toBeNull();
    expect(canAccessSection("helper", perms, "messages")).toBe(false);
  });
});
