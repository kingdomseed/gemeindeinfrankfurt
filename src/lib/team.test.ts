import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  createUser:
    vi.fn<() => Promise<{ data: { user: { id: string } | null }; error: Error | null }>>(),
  listUsers: vi.fn<
    () => Promise<{
      data: { users: { id: string; email?: string | undefined }[] };
      error: null;
    }>
  >(),
  upsert: vi.fn<(...args: unknown[]) => Promise<{ error: null }>>(),
  update: vi.fn<(...args: unknown[]) => void>(),
  eq: vi.fn<(...args: unknown[]) => Promise<{ error: null }>>(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        createUser: state.createUser,
        listUsers: state.listUsers,
      },
    },
    from: () => ({
      upsert: state.upsert,
      update: (values: unknown) => {
        state.update(values);
        return { eq: state.eq };
      },
    }),
  }),
}));

import { addCoordinator, saveRoleTabPermissions, setRole } from "./team";

beforeEach(() => {
  vi.clearAllMocks();
  state.upsert.mockResolvedValue({ error: null });
  state.eq.mockResolvedValue({ error: null });
});

describe("team management", () => {
  it("adds a coordinator or helper with the chosen role", async () => {
    state.createUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    await addCoordinator("Helper One", "helper@example.test", "helper");

    expect(state.upsert).toHaveBeenCalledWith(
      { user_id: "user-1", display_name: "Helper One", role: "helper", is_admin: false },
      { onConflict: "user_id" },
    );
  });

  it("grants admin on invite when role is admin, including for an existing auth user", async () => {
    state.createUser.mockResolvedValue({ data: { user: null }, error: new Error("exists") });
    state.listUsers.mockResolvedValue({
      data: { users: [{ id: "user-2", email: "Admin@Example.Test" }] },
      error: null,
    });

    await addCoordinator("Admin Coord", "admin@example.test", "admin");

    expect(state.upsert).toHaveBeenCalledWith(
      { user_id: "user-2", display_name: "Admin Coord", role: "admin", is_admin: true },
      { onConflict: "user_id" },
    );
  });

  it("updates role and is_admin in lockstep via setRole", async () => {
    await setRole("user-3", "admin");
    expect(state.update).toHaveBeenCalledWith({ role: "admin", is_admin: true });
    expect(state.eq).toHaveBeenCalledWith("user_id", "user-3");

    await setRole("user-3", "helper");
    expect(state.update).toHaveBeenLastCalledWith({ role: "helper", is_admin: false });
  });

  it("normalizes and saves per-role tab permissions", async () => {
    await saveRoleTabPermissions({
      coordinator: ["setup", "overview", "setup"],
      helper: ["messages"],
    });

    expect(state.upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({ role: "coordinator", tabs: ["overview", "setup"] }),
        expect.objectContaining({ role: "helper", tabs: ["messages"] }),
      ],
      { onConflict: "role" },
    );
  });
});
