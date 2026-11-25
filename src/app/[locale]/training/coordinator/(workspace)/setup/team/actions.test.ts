import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  refresh: vi.fn<() => void>(),
  getLocale: vi.fn<() => Promise<string>>(),
  getUser: vi.fn<() => Promise<{ data: { user: { id: string } | null } }>>(),
  isTeamAdmin: vi.fn<() => Promise<boolean>>(),
  addCoordinator: vi.fn<(name: string, email: string, isAdmin?: boolean) => Promise<void>>(),
  sendSignInLink: vi.fn<(email: string, locale: string) => Promise<void>>(),
  setAdmin: vi.fn<(userId: string, isAdmin: boolean) => Promise<void>>(),
}));

vi.mock("next/cache", () => ({ refresh: state.refresh }));
vi.mock("next-intl/server", () => ({ getLocale: state.getLocale }));
vi.mock("@/lib/auth", () => ({
  requireAuth: () => Promise.resolve({ auth: { getUser: state.getUser } }),
}));
vi.mock("@/lib/team", () => ({
  addCoordinator: state.addCoordinator,
  isTeamAdmin: state.isTeamAdmin,
  loadTeam: vi.fn<() => Promise<never[]>>(),
  removeCoordinator: vi.fn<() => Promise<void>>(),
  sendSignInLink: state.sendSignInLink,
  setAdmin: state.setAdmin,
  setServesAv: vi.fn<() => Promise<void>>(),
}));

import { changeAdminRole, inviteCoordinator } from "./actions";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";

function formWith(entries: Record<string, string>): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(entries)) form.set(k, v);
  return form;
}

beforeEach(() => {
  vi.clearAllMocks();
  state.getLocale.mockResolvedValue("en");
  state.isTeamAdmin.mockResolvedValue(true);
  state.getUser.mockResolvedValue({ data: { user: { id: ADMIN_ID } } });
});

describe("coordinator team actions", () => {
  it("invites a coordinator as regular or admin depending on checkbox", async () => {
    const regular = await inviteCoordinator(
      { status: "idle" },
      formWith({ name: "Alice", email: "alice@example.test" }),
    );
    expect(regular).toEqual({ status: "saved" });
    expect(state.addCoordinator).toHaveBeenCalledWith("Alice", "alice@example.test", false);

    const admin = await inviteCoordinator(
      { status: "idle" },
      formWith({ name: "Bob", email: "bob@example.test", is_admin: "true" }),
    );
    expect(admin).toEqual({ status: "saved" });
    expect(state.addCoordinator).toHaveBeenLastCalledWith("Bob", "bob@example.test", true);

    const bad = await inviteCoordinator(
      { status: "idle" },
      formWith({ name: "Bad", email: "bad@example.test", is_admin: "false" }),
    );
    expect(bad).toEqual({ status: "error" });
  });

  it("lets admins toggle another coordinator's admin role and blocks self-changes and non-admins", async () => {
    const promote = await changeAdminRole(
      { status: "idle" },
      formWith({ user_id: OTHER_ID, is_admin: "true" }),
    );
    expect(promote).toEqual({ status: "saved" });
    expect(state.setAdmin).toHaveBeenCalledWith(OTHER_ID, true);
    expect(state.refresh).toHaveBeenCalledTimes(1);

    const selfChange = await changeAdminRole(
      { status: "idle" },
      formWith({ user_id: ADMIN_ID, is_admin: "false" }),
    );
    expect(selfChange).toEqual({ status: "error" });
    expect(state.setAdmin).toHaveBeenCalledTimes(1);

    state.isTeamAdmin.mockResolvedValueOnce(false);
    const nonAdmin = await changeAdminRole(
      { status: "idle" },
      formWith({ user_id: OTHER_ID, is_admin: "true" }),
    );
    expect(nonAdmin).toEqual({ status: "error" });
    expect(state.setAdmin).toHaveBeenCalledTimes(1);
  });
});
