import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  refresh: vi.fn<() => void>(),
  getLocale: vi.fn<() => Promise<string>>(),
  getUser: vi.fn<() => Promise<{ data: { user: { id: string } | null } }>>(),
  isTeamAdmin: vi.fn<() => Promise<boolean>>(),
  addCoordinator: vi.fn<(name: string, email: string, role?: string) => Promise<void>>(),
  sendSignInLink: vi.fn<(email: string, locale: string) => Promise<void>>(),
  setRole: vi.fn<(userId: string, role: string) => Promise<void>>(),
  saveRoleTabPermissions: vi.fn<(permissions: unknown) => Promise<void>>(),
}));

vi.mock("next/cache", () => ({ refresh: state.refresh }));
vi.mock("next-intl/server", () => ({ getLocale: state.getLocale }));
vi.mock("@/lib/auth", () => ({
  requireAuth: () => Promise.resolve({ auth: { getUser: state.getUser } }),
  requireSectionAuth: () => Promise.resolve({ auth: { getUser: state.getUser } }),
}));
vi.mock("@/lib/team", () => ({
  addCoordinator: state.addCoordinator,
  isTeamAdmin: state.isTeamAdmin,
  loadTeam: vi.fn<() => Promise<never[]>>(),
  removeCoordinator: vi.fn<() => Promise<void>>(),
  saveRoleTabPermissions: state.saveRoleTabPermissions,
  sendSignInLink: state.sendSignInLink,
  setRole: state.setRole,
  setServesAv: vi.fn<() => Promise<void>>(),
}));

import { changeMemberRole, inviteCoordinator, saveTabPermissions } from "./actions";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";

function formWith(entries: Record<string, string | string[]>): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    if (Array.isArray(v)) {
      for (const item of v) form.append(k, item);
    } else {
      form.set(k, v);
    }
  }
  return form;
}

beforeEach(() => {
  vi.clearAllMocks();
  state.getLocale.mockResolvedValue("en");
  state.isTeamAdmin.mockResolvedValue(true);
  state.getUser.mockResolvedValue({ data: { user: { id: ADMIN_ID } } });
});

describe("coordinator team actions", () => {
  it("invites a team member with the selected role", async () => {
    const regular = await inviteCoordinator(
      { status: "idle" },
      formWith({ name: "Alice", email: "alice@example.test", role: "coordinator" }),
    );
    expect(regular).toEqual({ status: "saved" });
    expect(state.addCoordinator).toHaveBeenCalledWith("Alice", "alice@example.test", "coordinator");

    const helper = await inviteCoordinator(
      { status: "idle" },
      formWith({ name: "Herb", email: "herb@example.test", role: "helper" }),
    );
    expect(helper).toEqual({ status: "saved" });
    expect(state.addCoordinator).toHaveBeenLastCalledWith("Herb", "herb@example.test", "helper");

    const bad = await inviteCoordinator(
      { status: "idle" },
      formWith({ name: "Bad", email: "bad@example.test", role: "guest" }),
    );
    expect(bad).toEqual({ status: "error" });
  });

  it("lets admins change another member's role and blocks self-changes and non-admins", async () => {
    const demote = await changeMemberRole(
      { status: "idle" },
      formWith({ user_id: OTHER_ID, role: "helper" }),
    );
    expect(demote).toEqual({ status: "saved" });
    expect(state.setRole).toHaveBeenCalledWith(OTHER_ID, "helper");
    expect(state.refresh).toHaveBeenCalledTimes(1);

    const selfChange = await changeMemberRole(
      { status: "idle" },
      formWith({ user_id: ADMIN_ID, role: "helper" }),
    );
    expect(selfChange).toEqual({ status: "error" });
    expect(state.setRole).toHaveBeenCalledTimes(1);

    state.isTeamAdmin.mockResolvedValueOnce(false);
    const nonAdmin = await changeMemberRole(
      { status: "idle" },
      formWith({ user_id: OTHER_ID, role: "admin" }),
    );
    expect(nonAdmin).toEqual({ status: "error" });
    expect(state.setRole).toHaveBeenCalledTimes(1);
  });

  it("lets admins save tab permissions and rejects non-admins or invalid section keys", async () => {
    const saved = await saveTabPermissions(
      { status: "idle" },
      formWith({ coordinator: ["overview", "messages"], helper: ["messages"] }),
    );
    expect(saved).toEqual({ status: "saved" });
    expect(state.saveRoleTabPermissions).toHaveBeenCalledWith({
      coordinator: ["overview", "messages"],
      helper: ["messages"],
    });
    expect(state.refresh).toHaveBeenCalledTimes(1);

    const invalid = await saveTabPermissions(
      { status: "idle" },
      formWith({ coordinator: ["overview"], helper: ["not_a_tab"] }),
    );
    expect(invalid).toEqual({ status: "error" });
    expect(state.saveRoleTabPermissions).toHaveBeenCalledTimes(1);

    state.isTeamAdmin.mockResolvedValueOnce(false);
    const nonAdmin = await saveTabPermissions(
      { status: "idle" },
      formWith({ coordinator: ["overview"], helper: ["messages"] }),
    );
    expect(nonAdmin).toEqual({ status: "error" });
    expect(state.saveRoleTabPermissions).toHaveBeenCalledTimes(1);
  });
});
