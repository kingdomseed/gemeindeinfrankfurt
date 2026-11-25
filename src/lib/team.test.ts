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

import { addCoordinator, setAdmin } from "./team";

beforeEach(() => {
  vi.clearAllMocks();
  state.upsert.mockResolvedValue({ error: null });
  state.eq.mockResolvedValue({ error: null });
});

describe("team management", () => {
  it("adds a regular coordinator without overwriting existing admin status", async () => {
    state.createUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    await addCoordinator("Regular Coord", "coord@example.test");

    expect(state.upsert).toHaveBeenCalledWith(
      { user_id: "user-1", display_name: "Regular Coord" },
      { onConflict: "user_id" },
    );
  });

  it("grants admin on invite when isAdmin is true, including for an existing auth user", async () => {
    state.createUser.mockResolvedValue({ data: { user: null }, error: new Error("exists") });
    state.listUsers.mockResolvedValue({
      data: { users: [{ id: "user-2", email: "Admin@Example.Test" }] },
      error: null,
    });

    await addCoordinator("Admin Coord", "admin@example.test", true);

    expect(state.upsert).toHaveBeenCalledWith(
      { user_id: "user-2", display_name: "Admin Coord", is_admin: true },
      { onConflict: "user_id" },
    );
  });

  it("updates is_admin via setAdmin", async () => {
    await setAdmin("user-3", true);
    expect(state.update).toHaveBeenCalledWith({ is_admin: true });
    expect(state.eq).toHaveBeenCalledWith("user_id", "user-3");

    await setAdmin("user-3", false);
    expect(state.update).toHaveBeenLastCalledWith({ is_admin: false });
  });
});
